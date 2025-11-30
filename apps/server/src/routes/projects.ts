import { Hono } from 'hono'
import { db, project, prompt, withDefaults, user } from '@repo/db'
import { eq } from 'drizzle-orm'

const router = new Hono()



// Get all projects
router.get('/', async (c) => {
  try {
    const projects = await db
      .select()
      .from(project)
    
    return c.json({ projects })
  } catch (error) {
    return c.json({ error: 'Failed to fetch projects' }, 500)
  }
})



// Create a new project
router.post('/', async (c) => {
  try {
    const body = await c.req.json()
    const { prompt: promptText } = body

    // TODO: Create name from prompt
    const name = `Project for ${promptText.slice(0, 20)}...`
    console.log('Creating project with name:', name)
    
    const projectData = {
      name
    }
    
    const [insertedProject] = await db
      .insert(project)
      .values(withDefaults(projectData))
      .returning()

    const promptData = {
      projectId: insertedProject.id,
      text: promptText
    }

    await db
      .insert(prompt)
      .values(withDefaults(promptData))
      .execute()
    
    return c.json({ ...insertedProject }, 201)
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500)
  }
})



// Get all prompts for a project
router.get('/:projectId/chat', async (c) => {
  try {
    const projectId = c.req.param('projectId')
    
    if (!projectId) {
      return c.json({ error: 'Project ID is required' }, 400)
    }
    
    const prompts = await db
      .select()
      .from(prompt)
      .where(eq(prompt.projectId, projectId))
      .orderBy(prompt.createdAt)
    
    return c.json({ prompts })
  } catch (error) {
    return c.json({ error: 'Failed to fetch prompts' }, 500)
  }
})



// Create a new prompt for a project
router.post('/:projectId/chat', async (c) => {
  try {
    const projectId = c.req.param('projectId')
    const body = await c.req.json()
    const { prompt: promptText } = body

    if (!projectId) {
      return c.json({ error: 'Project ID is required' }, 400)
    }

    const promptData = {
      projectId,
      text: promptText
    }

    const [insertedPrompt] = await db
      .insert(prompt)
      .values(withDefaults(promptData))
      .returning()
    
    return c.json({ ...insertedPrompt }, 201)
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500)
  }
})



export default router
