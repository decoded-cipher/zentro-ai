
import { consume } from '@repo/queue';
import { setProject, updateHeartbeat, getAllProjects, deleteProject } from '@repo/redis';
import dotenv from 'dotenv';
import { CONFIG } from './config';
import { ensureNetwork, startContainer, stopAndRemoveContainer, connectToNetwork } from './docker';
import { startLogCollection, stopLogCollection, stopAllLogCollections, restoreLogCollections } from './logCollector';

dotenv.config();

// Provision a new project
async function provisionProject(projectId: string) {
    console.log(`\n\nReceived project.created for ${projectId}`);
    const projectPath = `/tmp/zentro/projects/${projectId}`;
    const projectNetwork = `project-${projectId}-net`;

    try {
        // 0. Create Project Network
        await ensureNetwork(projectNetwork);

        // 1. Provision Code Server
        console.log(`Starting code-server for ${projectId}...`);
        const codeServer = await startContainer({
            image: CONFIG.IMAGES.CODE_SERVER,
            name: `code-server-${projectId}`,
            projectId,
            type: 'code-server',
            env: [`PROJECT_ID=${projectId}`],
            portBindings: { 
                '8080/tcp': [{ HostPort: '0' }],
                '5173/tcp': [{ HostPort: '0' }]
            },
            binds: [`${projectPath}:/tmp/zentro`],
            network: projectNetwork
        });

        if (!codeServer.ports['8080/tcp']) throw new Error('Failed to get code-server port');
        const devServerPort = codeServer.ports['5173/tcp'];
        console.log(`Code server started on port ${codeServer.ports['8080/tcp']}${devServerPort ? `, dev server port ${devServerPort}` : ''}`);

        // Start log collection for code-server
        await startLogCollection(
            codeServer.id, 
            `code-server-${projectId}`, 
            projectId
        );

        // 2. Provision Worker (Infra Network + Project Network)
        console.log(`Starting worker for ${projectId}...`);
        const worker = await startContainer({
            image: CONFIG.IMAGES.WORKER,
            name: `worker-${projectId}`,
            projectId,
            type: 'worker',
            env: [
                `PROJECT_ID=${projectId}`
            ],
            portBindings: { '9091/tcp': [{ HostPort: '0' }] },
            binds: [`${projectPath}:/tmp/zentro`],
            network: CONFIG.NETWORK_NAME // Connect to infra network first
        });

        if (!worker.ports['9091/tcp']) throw new Error('Failed to get worker port');
        
        // Connect worker to project network as well
        await connectToNetwork(worker.id, projectNetwork);
        console.log(`Worker started for ${projectId} on port ${worker.ports['9091/tcp']} and connected to ${projectNetwork}`);

        // Start log collection for worker
        await startLogCollection(
            worker.id, 
            `worker-${projectId}`, 
            projectId
        );

        
        // 3. Store mapping in Redis
        await setProject(projectId, {
            codeServerPort: codeServer.ports['8080/tcp'],
            devServerPort: codeServer.ports['5173/tcp'],
            workerPort: worker.ports['9091/tcp'],
            codeServerContainerId: codeServer.id,
            workerContainerId: worker.id,
            status: 'running',
            createdAt: new Date().toISOString(),
            lastHeartbeat: Date.now()
        });

        console.log(`Provisioning complete for ${projectId}`);

    } catch (error) {
        console.error(`Failed to provision for ${projectId}:`, error);
        // TODO: Add cleanup logic for partial failures
    }
}



// Cleanup stale projects
async function cleanupStaleProjects() {
    try {
        const projects = await getAllProjects();
        const now = Date.now();

        for (const project of projects) {
            const lastHeartbeat = parseInt(project.lastHeartbeat || '0');
            if (now - lastHeartbeat > CONFIG.HEARTBEAT_TIMEOUT) {
                console.log(`Project ${project.id} timed out. Cleaning up...`);

                // Stop log collection
                if (project.codeServerContainerId) {
                    await stopLogCollection(project.codeServerContainerId);
                }

                if (project.workerContainerId) {
                    await stopLogCollection(project.workerContainerId);
                }

                // Stop and remove containers
                if (project.codeServerContainerId) {
                    await stopAndRemoveContainer(project.codeServerContainerId);
                }

                if (project.workerContainerId) {
                    await stopAndRemoveContainer(project.workerContainerId);
                }

                // Delete from Redis
                await deleteProject(project.id);
                console.log(`Cleanup complete for ${project.id}`);
            }
        }
    } catch (error) {
        console.error('Error in cleanup task:', error);
    }
}



async function main() {
    console.log('Manager service starting...');
    
    await ensureNetwork();

    // Restore log collection for existing containers
    await restoreLogCollections();

    // Listen for project creation events
    await consume('manager_queue', 'project_events', 'project.created', async (msg) => {
        const { projectId } = msg.data as { projectId: string };
        await provisionProject(projectId);
    });

    // Listen for heartbeats
    await consume('manager_heartbeats', 'project_events', 'project.heartbeat', async (msg) => {
        const { projectId } = msg.data as { projectId: string };
        if (projectId) {
            await updateHeartbeat(projectId);
        }
    });

    // Periodic cleanup task - DISABLED for development
    // Uncomment to enable automatic cleanup of stale projects after HEARTBEAT_TIMEOUT (60s)
    // setInterval(cleanupStaleProjects, CONFIG.CHECK_INTERVAL);
    
    console.log('Cleanup task is DISABLED. Containers will not be automatically removed.');

    // Handle graceful shutdown
    process.on('SIGTERM', async () => {
        console.log('SIGTERM received, shutting down gracefully');
        await stopAllLogCollections();
        process.exit(0);
    });

    process.on('SIGINT', async () => {
        console.log('SIGINT received, shutting down gracefully');
        await stopAllLogCollections();
        process.exit(0);
    });
}

main().catch((err) => {
    console.error('Manager service failed to start', err);
    process.exit(1);
});
