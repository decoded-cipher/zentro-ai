import { Hono } from 'hono'
import { db, project, prompt, withDefaults, user } from '@repo/db'
import { eq } from 'drizzle-orm'
import { publish } from '@repo/queue'
import { getProject } from '@repo/redis'

const router = new Hono()



// Get all projects (paginated)
router.get('/', async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1')
    const limit = parseInt(c.req.query('limit') || '10')
    const offset = (page - 1) * limit

    const projects = await db
      .select()
      .from(project)
      .limit(limit + 1)
      .offset(offset)
    
    const hasMore = projects.length > limit
    const projectsToReturn = hasMore ? projects.slice(0, limit) : projects
    
    return c.json({ 
      projects: projectsToReturn,
      hasMore,
      page,
      limit
    })
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
    
    // Publish to queue for manager to provision resources
    try {
        await publish('project_events', 'project.created', {
            type: 'project.created',
            data: {
                projectId: insertedProject.id
            }
        });
    } catch (err) {
        console.error('Failed to publish project.created message', err);
    }

    return c.json({ ...insertedProject }, 201)
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500)
  }
})



// Get project status and container endpoints from Redis
router.get('/:projectId/status', async (c) => {
    const projectId = c.req.param('projectId')
    
    try {
        const projectData = await getProject(projectId)
        
        if (!projectData || Object.keys(projectData).length === 0) {
            return c.json({
                status: 'pending',
                message: 'Project is being provisioned'
            })
        }
        
        if (projectData.status === 'running') {
            return c.json({
                status: 'ready',
                codeServerHost: `http://localhost:${projectData.codeServerPort}`,
                devServerHost: `http://localhost:${projectData.devServerPort}`,
                workerHost: `http://localhost:${projectData.workerPort}`,
                workerContainerId: projectData.workerContainerId,
                message: 'Project is ready'
            })
        }
        
        return c.json({
            status: projectData.status || 'pending',
            message: 'Project is being provisioned'
        })
    } catch (error) {
        console.error('Error fetching project status:', error)
        return c.json({ error: 'Failed to fetch project status' }, 500)
    }
})


// Send a chat message to the project
router.post('/:projectId/chat', async (c) => {
    const projectId = c.req.param('projectId')
    const body = await c.req.json()
    const { prompt: promptText } = body
    
    if (!projectId) {
        return c.json({ error: 'Project ID is required' }, 400)
    }
    
    if (!promptText) {
        return c.json({ error: 'Prompt is required' }, 400)
    }
    
    try {
        // Save the prompt to the database
        const promptData = {
            projectId,
            text: promptText,
            type: 'USER'
        }
        
        const [insertedPrompt] = await db
            .insert(prompt)
            .values(withDefaults(promptData))
            .returning()
        
        // Publish to queue for worker to process
        try {
            await publish('chat_events', 'chat.message', {
                type: 'chat.message',
                data: {
                    projectId,
                    promptId: insertedPrompt.id,
                    prompt: promptText
                }
            })
        } catch (err) {
            console.error('Failed to publish chat message to queue', err)
        }
        
        return c.json({ ...insertedPrompt }, 201)
    } catch (error) {
        return c.json({ error: (error as Error).message }, 500)
    }
})

export default router
