
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
    network?: string;
}



// Ensure the Docker network exists
export async function ensureNetwork(networkName: string = CONFIG.NETWORK_NAME): Promise<void> {
    try {
        const networks = await docker.listNetworks({
            filters: { name: [networkName] }
        });
        
        if (networks.length === 0) {
            console.log(`Creating network: ${networkName}`);
            await docker.createNetwork({
                Name: networkName,
                Driver: 'bridge',
                Labels: {
                    'com.docker.compose.project': CONFIG.PROJECT_NAME,
                    'managed-by': 'zentro-manager'
                }
            });
            console.log(`Network ${networkName} created`);
        }
    } catch (error) {
        console.error(`Failed to ensure network ${networkName} exists:`, error);
        throw error;
    }
}

// Connect a container to a network
export async function connectToNetwork(containerId: string, networkName: string): Promise<void> {
    try {
        const network = docker.getNetwork(networkName);
        await network.connect({ Container: containerId });
        console.log(`Connected container ${containerId} to network ${networkName}`);
    } catch (error) {
        console.error(`Failed to connect container ${containerId} to network ${networkName}:`, error);
        throw error;
    }
}

// Start a Docker container
export async function startContainer(options: ContainerOptions): Promise<{ id: string; ports: Record<string, string> }> {
    const { image, name, projectId, type, env = [], portBindings = {}, binds = [], network = CONFIG.NETWORK_NAME } = options;

    // Build ExposedPorts from portBindings
    const exposedPorts: Record<string, {}> = {};
    for (const portKey of Object.keys(portBindings)) {
        exposedPorts[portKey] = {};
    }

    const container = await docker.createContainer({
        Image: image,
        name,
        Labels: {
            'com.docker.compose.project': CONFIG.PROJECT_NAME,
            'zentro.project.id': projectId,
            'zentro.service.type': type,
            'managed-by': 'zentro-manager'
        },
        ExposedPorts: exposedPorts,
        HostConfig: {
            PortBindings: portBindings,
            Binds: binds
        },
        Env: env
    });

    await container.start();
    
    // Connect to the specified network after starting, 
    if (network) {
        try {
            await connectToNetwork(container.id, network);
        } catch (error) {
            console.error(`Failed to connect container to network ${network}, continuing anyway:`, error);
        }
    }
    
    const info = await container.inspect();
    
    // Find all mapped ports
    const ports = info.NetworkSettings.Ports;
    const mappedPorts: Record<string, string> = {};
    for (const portKey of Object.keys(portBindings)) {
        const hostPort = ports[portKey]?.[0]?.HostPort;
        if (hostPort) {
            mappedPorts[portKey] = hostPort;
        }
    }
    
    return { id: container.id, ports: mappedPorts };
}


// Stop and remove a Docker container
export async function stopAndRemoveContainer(containerId: string): Promise<void> {
    try {
        const container = docker.getContainer(containerId);
        await container.stop();
        await container.remove();
    } catch (error) {
        console.error(`Failed to remove container ${containerId}`, error);
    }
}
