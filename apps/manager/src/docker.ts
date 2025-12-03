
import Docker from 'dockerode';
import { CONFIG } from './config';

const docker = new Docker({ socketPath: CONFIG.DOCKER_SOCKET });

interface ContainerOptions {
    image: string;
    name: string;
    projectId: string;
    type: 'code-server' | 'worker';
    env?: string[];
    portBindings?: Record<string, { HostPort: string }[]>;
    binds?: string[];
}



// Ensure the Docker network exists
export async function ensureNetwork(): Promise<void> {
    try {
        const networks = await docker.listNetworks({
            filters: { name: [CONFIG.NETWORK_NAME] }
        });
        
        if (networks.length === 0) {
            console.log(`Creating network: ${CONFIG.NETWORK_NAME}`);
            await docker.createNetwork({
                Name: CONFIG.NETWORK_NAME,
                Driver: 'bridge',
                Labels: {
                    'com.docker.compose.project': CONFIG.PROJECT_NAME,
                    'managed-by': 'zentro-manager'
                }
            });
            console.log(`Network ${CONFIG.NETWORK_NAME} created`);
        }
    } catch (error) {
        console.error('Failed to ensure network exists:', error);
        throw error;
    }
}



// Start a Docker container
export async function startContainer(options: ContainerOptions): Promise<{ id: string; port?: string }> {
    const { image, name, projectId, type, env = [], portBindings = {}, binds = [] } = options;

    const container = await docker.createContainer({
        Image: image,
        name,
        Labels: {
            'com.docker.compose.project': CONFIG.PROJECT_NAME,
            'zentro.project.id': projectId,
            'zentro.service.type': type,
            'managed-by': 'zentro-manager'
        },
        HostConfig: {
            PortBindings: portBindings,
            Binds: binds,
            NetworkMode: CONFIG.NETWORK_NAME
        },
        Env: env
    });

    await container.start();
    const info = await container.inspect();
    
    // Find the first mapped port
    const ports = info.NetworkSettings.Ports;
    const firstPortKey = Object.keys(portBindings)[0];
    const port = firstPortKey && ports[firstPortKey]?.[0]?.HostPort;

    return { id: container.id, port };
}


// Stop and remove a Docker container
export async function stopAndRemoveContainer(containerId: string): Promise<void> {
    try {
        const container = docker.getContainer(containerId);
        await container.stop();
        await container.remove();
    } catch (error) {
        // Ignore if container already gone
        console.error(`Failed to remove container ${containerId}`, error);
    }
}
