import { describe, it, expect, beforeEach, afterAll } from "bun:test";

// Set env var before import
process.env.REDIS_URL = "redis://localhost:6379";

// Dynamic import to ensure env var is picked up
const { setProject, getProject, updateHeartbeat, getAllProjects, deleteProject, redis } = await import("./index");

describe("Redis Package Integration Tests", () => {
  // Clean up before each test
  beforeEach(async () => {
    const keys = await redis.keys("project:*");
    if (keys.length > 0) {
      await redis.del(keys);
    }
  });

  afterAll(async () => {
      await redis.quit();
  });

  it("setProject should save data to redis", async () => {
    const projectId = "123";
    const data = { name: "test" };
    await setProject(projectId, data);
    
    const stored = await redis.hgetall(`project:${projectId}`);
    expect(stored).toEqual(data);
  });

  it("getProject should retrieve data from redis", async () => {
    const projectId = "123";
    const mockData = { name: "test" };
    await redis.hset(`project:${projectId}`, mockData);
    
    const result = await getProject(projectId);
    expect(result).toEqual(mockData);
  });

  it("updateHeartbeat should update lastHeartbeat", async () => {
    const projectId = "123";
    await updateHeartbeat(projectId);
    
    const stored = await redis.hgetall(`project:${projectId}`);
    expect(stored).toHaveProperty("lastHeartbeat");
    // Verify it's a recent timestamp if possible, or just that it exists
    expect(Number(stored.lastHeartbeat)).toBeGreaterThan(0);
  });

  it("getAllProjects should return all projects", async () => {
    await redis.hset("project:1", { name: "p1" });
    await redis.hset("project:2", { name: "p2" });

    const result = await getAllProjects();
    // Sort to ensure order doesn't matter
    result.sort((a, b) => a.id.localeCompare(b.id));
    
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ name: "p1", id: "1" });
    expect(result[1]).toEqual({ name: "p2", id: "2" });
  });

  it("deleteProject should remove data from redis", async () => {
    const projectId = "123";
    await redis.hset(`project:${projectId}`, { name: "test" });
    
    await deleteProject(projectId);
    
    const stored = await redis.exists(`project:${projectId}`);
    expect(stored).toBe(0);
  });
});
