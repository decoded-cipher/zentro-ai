
export const CONFIG = {
    DOCKER_SOCKET: '/var/run/docker.sock',
    HEARTBEAT_TIMEOUT: 60 * 1000,
    CHECK_INTERVAL: 30 * 1000,
    PROJECT_NAME: 'zentro-projects',
    NETWORK_NAME: 'zentro-network',
    IMAGES: {
        CODE_SERVER: 'zentro-code-server',
        WORKER: 'zentro-worker'
    }
};
