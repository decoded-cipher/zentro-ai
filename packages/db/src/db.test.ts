
import { describe, test, expect } from 'bun:test';
import { db } from './db';
import { user, project } from './schema';
import { sql } from 'drizzle-orm';


describe('Database Connection', () => {
  test('Connect to DB and list tables', async () => {
    const result = await db.execute(
      sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('user', 'project')`
    );
    expect(result.rows).toBeArray();
    expect(result.rows.length).toBe(2);
    
    const tableNames = result.rows.map((row: any) => row.table_name);
    expect(tableNames).toContain('user');
    expect(tableNames).toContain('project');
  });
});


describe('Schema Exports', () => {
  test('Schema objects are defined', () => {
    expect(user).toBeDefined();
    expect(project).toBeDefined();
  });
});
