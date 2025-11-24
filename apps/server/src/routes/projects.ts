import { Hono } from 'hono'
import { nanoid } from 'nanoid'
import { db } from 'db'
import { project, prompt } from 'db'
import { eq } from 'drizzle-orm'

const router = new Hono()



// Get all projects
router.get('/', async (c) => {
  try {
    const userId = c.get('userId')
    
    const projects = await db
      .select()
      .from(project)
      .where(eq(project.userId, userId))
    
    return c.json({ projects })
  } catch (error) {
    return c.json({ error: 'Failed to fetch projects' }, 500)
  }
})



// Create a new project
router.post('/', async (c) => {
  try {
    const userId = c.get('userId')
    
    const body = await c.req.json()
    const { name, description } = body
    
    if (!name) {
      return c.json({ error: 'Project name is required' }, 400)
    }
    
    const now = Math.floor(Date.now() / 1000)
    const projectId = `proj_${nanoid()}`
    
    const newProject = {
      id: projectId,
      userId,
      name,
      description: description || null,
      createdAt: now,
      updatedAt: now
    }
    
    await db.insert(project).values(newProject)
    
    return c.json({ project: newProject }, 201)
  } catch (error) {
    return c.json({ error: 'Failed to create project' }, 500)
  }
})



// Get all prompts for a project
router.get('/:projectId/prompts', async (c) => {
  try {
    const projectId = c.req.param('projectId')
    
    if (!projectId) {
      return c.json({ error: 'Project ID is required' }, 400)
    }
    
    const prompts = await db
      .select()
      .from(prompt)
      .where(eq(prompt.projectId, projectId))
    
    return c.json({ prompts })
  } catch (error) {
    return c.json({ error: 'Failed to fetch prompts' }, 500)
  }
})



export default router
