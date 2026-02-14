import { Hono } from 'hono'
import { db, project, prompt, withDefaults, user } from '@repo/db'
import { eq, asc } from 'drizzle-orm'
import { publish, ensureQueue } from '@repo/queue'
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

    const projectData = { name: null }
    
    const [insertedProject] = await db
      .insert(project)
      .values(withDefaults(projectData))
      .returning()

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

    // Park the prompt in the chat queue
    try {
        const queueName = `chat_queue_${insertedProject.id}`;
        const exchangeName = 'chat_exchange';
        const routingKey = `chat.message.${insertedProject.id}`;

        await ensureQueue(queueName, exchangeName, routingKey);
        
        await publish(exchangeName, routingKey, {
            type: 'chat.message',
            data: {
                projectId: insertedProject.id,
                prompt: promptText
            }
        });
        console.log(`Parked prompt for project ${insertedProject.id} in queue ${queueName}`);
    } catch (err) {
        console.error('Failed to park prompt in chat queue', err);
    }

    return c.json({ ...insertedProject }, 201)
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500)
  }
})



// Get project messages
router.get('/:projectId/messages', async (c) => {
  try {
    const projectId = c.req.param('projectId')
    const messages = await db
      .select()
      .from(prompt)
      .where(eq(prompt.projectId, projectId))
      .orderBy(asc(prompt.createdAt))
    
    return c.json({ messages })
  } catch (error) {
    return c.json({ error: 'Failed to fetch messages' }, 500)
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


export default router
