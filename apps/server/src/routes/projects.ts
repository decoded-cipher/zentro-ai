import { Hono } from 'hono'
import { db, project, prompt, withDefaults } from '@repo/db'
import { eq, asc, desc, isNotNull, isNull, sql } from 'drizzle-orm'
import { publish, ensureQueue } from '@repo/queue'
import { getProject, tryProvLock } from '@repo/redis'

const router = new Hono()



// Get all projects (paginated)
router.get('/', async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1')
    const limit = parseInt(c.req.query('limit') || '10')
    const archived = c.req.query('archived')
    const offset = (page - 1) * limit

    const archiveFilter = archived === 'true'
      ? isNotNull(project.archivedAt)
      : archived === 'false'
        ? isNull(project.archivedAt)
        : undefined

    const query = db
      .select()
      .from(project)

    if (archiveFilter) {
      query.where(archiveFilter)
    }

    const projects = await query
      .orderBy(
        sql`CASE WHEN ${project.pinnedAt} IS NOT NULL THEN 0 ELSE 1 END`,
        desc(project.pinnedAt),
        desc(project.updatedAt)
      )
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



// Get a single project
router.get('/:projectId', async (c) => {
  try {
    const projectId = c.req.param('projectId')
    const [projectRow] = await db
      .select()
      .from(project)
      .where(eq(project.id, projectId))
      .limit(1)

    if (!projectRow) {
      return c.json({ error: 'Project not found' }, 404)
    }

    return c.json(projectRow)
  } catch (error) {
    return c.json({ error: 'Failed to fetch project' }, 500)
  }
})

// Create a new project
router.post('/', async (c) => {
  try {
    const body = await c.req.json()
    const { prompt: promptText, model: modelData } = body

    const projectData = { name: null, model: modelData ?? null }
    
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



// Update project (e.g. model)
router.patch('/:projectId', async (c) => {
  try {
    const projectId = c.req.param('projectId')
    const body = await c.req.json()
    const { model: modelData, name: newName, pinnedAt: pinnedAtValue, archivedAt: archivedAtValue } = body

    const [existing] = await db.select().from(project).where(eq(project.id, projectId)).limit(1)
    if (!existing) {
      return c.json({ error: 'Project not found' }, 404)
    }

    const updates: Record<string, any> = {
      updatedAt: Math.floor(Date.now() / 1000),
    }
    if (modelData !== undefined) {
      updates.model = modelData || null
    }
    if (newName !== undefined) {
      updates.name = newName?.trim() || null
    }
    if (pinnedAtValue !== undefined) {
      updates.pinnedAt = pinnedAtValue
    }
    if (archivedAtValue !== undefined) {
      updates.archivedAt = archivedAtValue
    }

    const [updated] = await db
      .update(project)
      .set(updates)
      .where(eq(project.id, projectId))
      .returning()

    return c.json(updated)
  } catch (error) {
    return c.json({ error: 'Failed to update project' }, 500)
  }
})

// Reopen a project
router.post('/:projectId', async (c) => {
    const projectId = c.req.param('projectId')

    try {
        const projectData = await getProject(projectId)
        if (projectData && Object.keys(projectData).length > 0) {
            return c.json({ message: 'Project already provisioned' }, 200)
        }

        const [existingProject] = await db.select().from(project).where(eq(project.id, projectId)).limit(1)
        if (!existingProject) {
            return c.json({ error: 'Project not found' }, 404)
        }

        const hasProvisioningLock = await tryProvLock(projectId)
        if (!hasProvisioningLock) {
            return c.json({ message: 'Provisioning already in progress' }, 200)
        }

        await publish('project_events', 'project.created', {
            type: 'project.created',
            data: { projectId }
        })
        console.log(`Triggered provisioning for opened project ${projectId}`)

        return c.json({ message: 'Provisioning triggered' }, 202)
    } catch (err) {
        console.error('Failed to trigger provisioning for opened project', err)
        return c.json({ error: 'Failed to trigger provisioning' }, 500)
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
