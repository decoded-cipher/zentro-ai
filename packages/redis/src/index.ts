import Redis from 'ioredis'

let globalRedis: Redis | null = null;

export function getRedisClient() {
    if (!globalRedis) {
        globalRedis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    }
    return globalRedis;
}

// Redis client setup and helper functions
// We use a Proxy to lazy-load the client to avoid top-level side effects in Cloudflare Workers
export const redis = new Proxy({} as Redis, {
    get(_target, prop) {
        const client = getRedisClient();
        // @ts-ignore
        const val = client[prop];
        if (typeof val === 'function') return val.bind(client);
        return val;
    }
});

export function createClient() {
    return new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
}



// Helper functions for project management in Redis
export async function setProject(projectId: string, data: Record<string, any>) {
    await getRedisClient().hset(`project:${projectId}`, data);
}


// Get project details
export async function getProject(projectId: string) {
    return await getRedisClient().hgetall(`project:${projectId}`);
}


// Update heartbeat timestamp
export async function updateHeartbeat(projectId: string) {
    await getRedisClient().hset(`project:${projectId}`, {
        lastHeartbeat: Date.now()
    });
}


// Get all projects
export async function getAllProjects() {
    const client = getRedisClient();
    const keys = await client.keys('project:*');
    const projects = [];
    for (const key of keys) {
        const project = await client.hgetall(key);
        projects.push({ ...project, id: key.split(':')[1] });
    }
    return projects;
}


// Delete project
export async function deleteProject(projectId: string) {
    await getRedisClient().del(`project:${projectId}`);
}


// Lock to prevent multiple instances from provisioning the same project simultaneously
export async function tryProvLock(projectId: string, ttlSeconds = 120): Promise<boolean> {
    const key = `provisioning:${projectId}`;
    const result = await getRedisClient().set(key, '1', 'EX', ttlSeconds, 'NX');
    return result === 'OK';
}
