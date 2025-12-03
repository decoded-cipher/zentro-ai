
import { consume } from '@repo/queue';
import { setProject, updateHeartbeat, getAllProjects, deleteProject } from '@repo/redis';
import Docker from 'dockerode';
import dotenv from 'dotenv';

dotenv.config();



const docker = new Docker({ socketPath: '/var/run/docker.sock' });
const HEARTBEAT_TIMEOUT = 30000; // 30 seconds
const CHECK_INTERVAL = 10000; // 10 seconds

// Docker project name for dynamically created containers
const PROJECT_NAME = 'zentro-projects';
const NETWORK_NAME = 'zentro-network';

// Ensure the network exists for dynamic containers
async function ensureNetwork(): Promise<void> {
    try {
        const networks = await docker.listNetworks({
            filters: { name: [NETWORK_NAME] }
        });
        
        if (networks.length === 0) {
            console.log(`Creating network: ${NETWORK_NAME}`);
            await docker.createNetwork({
                Name: NETWORK_NAME,
                Driver: 'bridge',
                Labels: {
                    'com.docker.compose.project': PROJECT_NAME,
                    'managed-by': 'zentro-manager'
                }
            });
            console.log(`Network ${NETWORK_NAME} created`);
        } else {
            console.log(`Network ${NETWORK_NAME} already exists`);
        }
    } catch (error) {
        console.error('Failed to ensure network exists:', error);
        throw error;
    }
}

async function main() {
    console.log('Manager service starting...');
    
    // Ensure the dedicated network exists for dynamic containers
    await ensureNetwork();

    // Listen for project creation events
    await consume('manager_queue', 'project_events', 'project.created', async (msg) => {
        const { projectId } = msg.data as { projectId: string };
        console.log(`Received project.created for ${projectId}`);

        try {
            const projectPath = `/tmp/zentro/projects/${projectId}`;

            // 1. Provision Code Server
            console.log(`Starting code-server for ${projectId}...`);
            const codeServerContainer = await docker.createContainer({
                Image: 'zentro-code-server', // Ensure this image is built: docker build -t zentro-code-server apps/code-server
                name: `code-server-${projectId}`,
                Labels: {
                    'com.docker.compose.project': PROJECT_NAME,
                    'zentro.project.id': projectId,
                    'zentro.service.type': 'code-server',
                    'managed-by': 'zentro-manager'
                },
                HostConfig: {
                    PortBindings: {
                        '8080/tcp': [{ HostPort: '0' }] // Assign random available port
                    },
                    Binds: [`${projectPath}:/tmp/zentro`],
                    NetworkMode: NETWORK_NAME
                },
                Env: [`PROJECT_ID=${projectId}`]
            });

            await codeServerContainer.start();
            const codeServerInfo = await codeServerContainer.inspect();
            const codeServerPort = codeServerInfo.NetworkSettings.Ports['8080/tcp']?.[0]?.HostPort;

            if (!codeServerPort) {
                throw new Error('Failed to get code-server port');
            }

            console.log(`Code server started on port ${codeServerPort}`);

            // 2. Provision Worker
            console.log(`Starting worker for ${projectId}...`);
            const workerContainer = await docker.createContainer({
                Image: 'zentro-worker',
                name: `worker-${projectId}`,
                Labels: {
                    'com.docker.compose.project': PROJECT_NAME,
                    'zentro.project.id': projectId,
                    'zentro.service.type': 'worker',
                    'managed-by': 'zentro-manager'
                },
                Env: [
                    `PROJECT_ID=${projectId}`,
                    `REDIS_URL=${process.env.REDIS_URL}`,
                    `RABBITMQ_HOST=rabbitmq`
                ],
                HostConfig: {
                    Binds: [`${projectPath}:/tmp/zentro`],
                    NetworkMode: NETWORK_NAME
                }
            });

            await workerContainer.start();
            console.log(`Worker started for ${projectId}`);

            // 3. Store mapping in Redis
            await setProject(projectId, {
                codeServerPort,
                codeServerContainerId: codeServerContainer.id,
                workerContainerId: workerContainer.id,
                status: 'running',
                createdAt: new Date().toISOString(),
                lastHeartbeat: Date.now()
            });

            console.log(`Provisioning complete for ${projectId}`);

        } catch (error) {
            console.error(`Failed to provision for ${projectId}:`, error);
            // Handle cleanup or retry logic here
        }
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
    // setInterval(async () => {
    //     try {
    //         const projects = await getAllProjects();
    //         const now = Date.now();

    //         for (const project of projects) {
    //             const lastHeartbeat = parseInt(project.lastHeartbeat || '0');
    //             if (now - lastHeartbeat > HEARTBEAT_TIMEOUT) {
    //                 console.log(`Project ${project.id} timed out. Cleaning up...`);
                    
    //                 // Kill containers
    //                 if (project.codeServerContainerId) {
    //                     try {
    //                         const container = docker.getContainer(project.codeServerContainerId);
    //                         await container.stop();
    //                         await container.remove();
    //                     } catch (e) {
    //                         console.error(`Failed to remove code-server for ${project.id}`, e);
    //                     }
    //                 }

    //                 if (project.workerContainerId) {
    //                     try {
    //                         const container = docker.getContainer(project.workerContainerId);
    //                         await container.stop();
    //                         await container.remove();
    //                     } catch (e) {
    //                         console.error(`Failed to remove worker for ${project.id}`, e);
    //                     }
    //                 }

    //                 // Remove from Redis
    //                 await deleteProject(project.id);
    //                 console.log(`Cleanup complete for ${project.id}`);
    //             }
    //         }
    //     } catch (error) {
    //         console.error('Error in cleanup task:', error);
    //     }
    // }, CHECK_INTERVAL);

}

main().catch((err) => {
    console.error('Manager service failed to start:', err);
    process.exit(1);
});
