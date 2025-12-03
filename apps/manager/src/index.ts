
import { consume } from '@repo/queue';
import { setProject, updateHeartbeat, getAllProjects, deleteProject } from '@repo/redis';
import dotenv from 'dotenv';
import { CONFIG } from './config';
import { ensureNetwork, startContainer, stopAndRemoveContainer } from './docker';

dotenv.config();



// Provision a new project
async function provisionProject(projectId: string) {
    console.log(`Received project.created for ${projectId}`);
    const projectPath = `/tmp/zentro/projects/${projectId}`;

    try {

        // 1. Provision Code Server
        console.log(`Starting code-server for ${projectId}...`);
        const codeServer = await startContainer({
            image: CONFIG.IMAGES.CODE_SERVER,
            name: `code-server-${projectId}`,
            projectId,
            type: 'code-server',
            env: [`PROJECT_ID=${projectId}`],
            portBindings: { '8080/tcp': [{ HostPort: '0' }] },
            binds: [`${projectPath}:/tmp/zentro`]
        });

        if (!codeServer.port) throw new Error('Failed to get code-server port');
        console.log(`Code server started on port ${codeServer.port}`);


        // 2. Provision Worker
        console.log(`Starting worker for ${projectId}...`);
        const worker = await startContainer({
            image: CONFIG.IMAGES.WORKER,
            name: `worker-${projectId}`,
            projectId,
            type: 'worker',
            env: [
                `PROJECT_ID=${projectId}`,
                `REDIS_URL=redis://redis:6379`,
                `DATABASE_URL=postgres://postgres:postgres@postgres:5432/zentro`,
                `RABBITMQ_HOST=rabbitmq`,
                `GEMINI_API_KEY=${process.env.GEMINI_API_KEY}`
            ],
            portBindings: { '9091/tcp': [{ HostPort: '0' }] },
            binds: [`${projectPath}:/tmp/zentro`]
        });

        if (!worker.port) throw new Error('Failed to get worker port');
        console.log(`Worker started for ${projectId} on port ${worker.port}`);

        
        // 3. Store mapping in Redis
        await setProject(projectId, {
            codeServerPort: codeServer.port,
            workerPort: worker.port,
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
                
                if (project.codeServerContainerId) {
                    await stopAndRemoveContainer(project.codeServerContainerId);
                }

                if (project.workerContainerId) {
                    await stopAndRemoveContainer(project.workerContainerId);
                }

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
            console.log(`Heartbeat received for ${projectId}`);
        }
    });

    // Periodic cleanup task
    // setInterval(cleanupStaleProjects, CONFIG.CHECK_INTERVAL);
}

main().catch((err) => {
    console.error('Manager service failed to start:', err);
    process.exit(1);
});
