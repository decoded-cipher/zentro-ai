import { Hono } from 'hono'
import { getProject } from '@repo/redis'
import { queryLogs, publishLog, publishLogs } from '@repo/logger'
import { createLogger } from '@repo/logger'

const router = new Hono()
const logger = createLogger({
  serviceName: 'server',
  serviceVersion: '1.0.0',
  container: 'server',
})

// Check if project is active or archived
router.get('/:projectId/status', async (c) => {
  const projectId = c.req.param('projectId')
  
  try {
    const project = await getProject(projectId)
    
    if (project && project.status === 'running') {
      return c.json({ status: 'active', storage: 'hot' })
    }
    
    // TODO: Check if archived in S3/metadata
    // For now, if not active, assume it doesn't exist
    // In full implementation, we'd check S3 for archived logs
    
    return c.json({ status: 'not_found' })
  } catch (error) {
    logger.error('Error checking log status', { 
      projectId,
      error: error instanceof Error ? error.message : String(error) 
    })
    return c.json({ error: 'Failed to check log status' }, 500)
  }
})

// Get logs (hot or cold based on project status)
router.get('/:projectId/logs', async (c) => {
  const projectId = c.req.param('projectId')
  
  try {
    const project = await getProject(projectId)
    const status = project?.status === 'running' ? 'active' : 'archived'
    
    const since = c.req.query('since') ? new Date(c.req.query('since')!) : undefined
    const until = c.req.query('until') ? new Date(c.req.query('until')!) : undefined
    const limit = parseInt(c.req.query('limit') || '1000')
    const level = c.req.query('level')
    const container = c.req.query('container')
    
    if (status === 'active') {
      // Query ClickHouse (hot storage)
      const logs = await queryLogs({
        projectId,
        since,
        until,
        limit,
        level,
        container
      })
      return c.json({ logs, storage: 'hot' })
    } else {
      // TODO: Query Parquet (cold storage)
      // For now, return empty array if archived
      // In full implementation, we'd query DuckDB/S3
      return c.json({ logs: [], storage: 'cold' })
    }
  } catch (error) {
    logger.error('Error fetching logs', { 
      projectId,
      error: error instanceof Error ? error.message : String(error) 
    })
    return c.json({ error: 'Failed to fetch logs' }, 500)
  }
})

// Real-time log streaming (only for active projects) - SSE
router.get('/:projectId/logs/stream', async (c) => {
  const projectId = c.req.param('projectId')
  
  try {
    const project = await getProject(projectId)
    
    if (!project || project.status !== 'running') {
      return c.json({ error: 'Project is not active' }, 400)
    }
    
    // Set up SSE headers
    c.header('Content-Type', 'text/event-stream')
    c.header('Cache-Control', 'no-cache')
    c.header('Connection', 'keep-alive')
    c.header('X-Accel-Buffering', 'no')
    
    // Get initial timestamp from query param if provided
    const sinceParam = c.req.query('since')
    let lastTimestamp = sinceParam ? new Date(sinceParam) : new Date(Date.now() - 60000) // Default: last minute
    
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        const sendLogs = async () => {
          try {
            const logs = await queryLogs({
              projectId,
              since: lastTimestamp,
              limit: 100
            })
            
            if (logs.length > 0) {
              // Sort logs by timestamp ASC to get oldest first
              logs.sort((a, b) => 
                new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
              )
              
              // Update last timestamp to the most recent log
              const latestLog = logs[logs.length - 1]
              if (latestLog.timestamp) {
                lastTimestamp = new Date(latestLog.timestamp)
              }
              
              // Send each log as an SSE message
              for (const log of logs) {
                const data = JSON.stringify(log)
                controller.enqueue(encoder.encode(`data: ${data}\n\n`))
              }
            }
          } catch (error) {
            logger.error('Error streaming logs', { 
              projectId,
              error: error instanceof Error ? error.message : String(error) 
            })
            controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ error: 'Failed to fetch logs' })}\n\n`))
          }
        }
        
        // Send initial batch
        await sendLogs()
        
        // Poll every second
        let intervalId: NodeJS.Timeout | null = null
        intervalId = setInterval(async () => {
          try {
            await sendLogs()
          } catch (error) {
            if (intervalId) clearInterval(intervalId)
            controller.close()
          }
        }, 1000)
        
        // Note: Cleanup will happen when the stream is closed
        // In production, you might want to track connections more robustly
      }
    })
    
    return c.body(stream)
  } catch (error) {
    logger.error('Error setting up log stream', { 
      projectId,
      error: error instanceof Error ? error.message : String(error) 
    })
    return c.json({ error: 'Failed to setup log stream' }, 500)
  }
})

// Insert a single log entry
router.post('/:projectId/logs', async (c) => {
  const projectId = c.req.param('projectId')
  
  try {
    const body = await c.req.json()
    const { service, container, level, message, labels, metadata } = body
    
    if (!service || !container || !level || !message) {
      return c.json({ 
        error: 'Missing required fields: service, container, level, message' 
      }, 400)
    }
    
    await publishLog({
      timestamp: new Date().toISOString(),
      projectId,
      service,
      container,
      level,
      message,
      labels,
      metadata
    })
    
    logger.debug('Log inserted', { projectId, level, container: container })
    return c.json({ success: true })
  } catch (error) {
    logger.error('Error inserting log', { 
      projectId,
      error: error instanceof Error ? error.message : String(error) 
    })
    return c.json({ error: 'Failed to insert log' }, 500)
  }
})

// Insert multiple log entries (batch)
router.post('/:projectId/logs/batch', async (c) => {
  const projectId = c.req.param('projectId')
  
  try {
    const body = await c.req.json()
    const { logs } = body
    
    if (!Array.isArray(logs) || logs.length === 0) {
      return c.json({ error: 'logs must be a non-empty array' }, 400)
    }
    
    const logEntries = logs.map((log: any) => ({
      timestamp: log.timestamp ? new Date(log.timestamp).toISOString() : new Date().toISOString(),
      projectId,
      service: log.service,
      container: log.container,
      level: log.level,
      message: log.message,
      labels: log.labels,
      metadata: log.metadata,
    }))
    
    await publishLogs(logEntries)
    
    logger.debug('Logs inserted', { projectId, count: logEntries.length })
    return c.json({ success: true, count: logEntries.length })
  } catch (error) {
    logger.error('Error inserting logs', { 
      projectId,
      error: error instanceof Error ? error.message : String(error) 
    })
    return c.json({ error: 'Failed to insert logs' }, 500)
  }
})

export default router

