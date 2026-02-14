import { createClient, Client } from '@clickhouse/client'

let globalClient: Client | null = null

export function getClickHouseClient(): Client {
  if (!globalClient) {
    const url = process.env.CLICKHOUSE_URL
    const database = process.env.CLICKHOUSE_DB
    const username = process.env.CLICKHOUSE_USER
    const password = process.env.CLICKHOUSE_PASSWORD

    if (!url || !database || !username || !password) {
      throw new Error(
        'ClickHouse configuration missing. Please set the following environment variables:\n' +
        '  CLICKHOUSE_URL - ClickHouse server URL (e.g., https://your-instance.clickhouse.cloud:8443)\n' +
        '  CLICKHOUSE_DB - Database name (e.g., zentro_logs)\n' +
        '  CLICKHOUSE_USER - Username\n' +
        '  CLICKHOUSE_PASSWORD - Password'
      )
    }

    globalClient = createClient({
      url,
      database,
      username,
      password,
    })
  }
  return globalClient
}

export function createClickHouseClient(): Client {
  const url = process.env.CLICKHOUSE_URL
  const database = process.env.CLICKHOUSE_DB
  const username = process.env.CLICKHOUSE_USER
  const password = process.env.CLICKHOUSE_PASSWORD

  if (!url || !database || !username || !password) {
    throw new Error(
      'ClickHouse configuration missing. Please set the following environment variables:\n' +
      '  CLICKHOUSE_URL - ClickHouse server URL\n' +
      '  CLICKHOUSE_DB - Database name\n' +
      '  CLICKHOUSE_USER - Username\n' +
      '  CLICKHOUSE_PASSWORD - Password'
    )
  }

  return createClient({
    url,
    database,
    username,
    password,
  })
}

export interface LogEntry {
  timestamp: string
  projectId: string
  service: string
  container: string
  level: string
  message: string
  labels: Record<string, string>
  metadata: string
}

export interface LogQueryParams {
  projectId: string
  since?: Date
  until?: Date
  limit?: number
  level?: string
  container?: string
}

/**
 * Query logs from ClickHouse with filters
 */
export async function queryLogs(params: LogQueryParams): Promise<LogEntry[]> {
  const { projectId, since, until, limit = 1000, level, container } = params
  const client = getClickHouseClient()
  
  let query = `
    SELECT 
      timestamp,
      projectId,
      service,
      container,
      level,
      message,
      labels,
      metadata
    FROM logs
    WHERE projectId = {projectId:String}
  `
  
  const queryParams: Record<string, any> = { projectId }
  
  if (since) {
    query += ` AND timestamp >= {since:DateTime64}`
    queryParams.since = since
  }
  
  if (until) {
    query += ` AND timestamp <= {until:DateTime64}`
    queryParams.until = until
  }
  
  if (level) {
    query += ` AND level = {level:String}`
    queryParams.level = level
  }
  
  if (container) {
    query += ` AND container = {container:String}`
    queryParams.container = container
  }
  
  query += ` ORDER BY timestamp DESC LIMIT {limit:UInt32}`
  queryParams.limit = limit
  
  try {
    const result = await client.query({
      query,
      query_params: queryParams,
      format: 'JSONEachRow'
    })
    
    const logs = await result.json<Array<Omit<LogEntry, 'labels'> & { labels: string }>>()
    // Parse labels from JSON strings
    return logs.map(log => ({
      ...log,
      labels: typeof log.labels === 'string' ? JSON.parse(log.labels || '{}') : log.labels
    }))
  } catch (error) {
    console.error('Error querying ClickHouse logs:', error)
    throw error
  }
}

/**
 * Get all logs for a project (ordered by timestamp ASC for archival)
 */
export async function getAllProjectLogs(projectId: string): Promise<LogEntry[]> {
  const client = getClickHouseClient()
  
  try {
    const result = await client.query({
      query: `
        SELECT * FROM logs
        WHERE projectId = {projectId:String}
        ORDER BY timestamp ASC
      `,
      query_params: { projectId },
      format: 'JSONEachRow'
    })
    
    const logs = await result.json<Array<Omit<LogEntry, 'labels'> & { labels: string }>>()
    // Parse labels from JSON strings
    return logs.map(log => ({
      ...log,
      labels: typeof log.labels === 'string' ? JSON.parse(log.labels || '{}') : log.labels
    }))
  } catch (error) {
    console.error(`Error fetching all logs for project ${projectId}:`, error)
    throw error
  }
}

/**
 * Insert a log entry into ClickHouse
 */
export async function insertLog(log: {
  projectId: string
  service: string
  container: string
  level: string
  message: string
  labels?: Record<string, string>
  metadata?: string
}): Promise<void> {
  const client = getClickHouseClient()
  
  try {
    await client.insert({
      table: 'logs',
      values: [{
        timestamp: new Date(),
        projectId: log.projectId,
        service: log.service,
        container: log.container,
        level: log.level,
        message: log.message,
        labels: JSON.stringify(log.labels || {}),
        metadata: log.metadata || ''
      }],
      format: 'JSONEachRow'
    })
  } catch (error) {
    console.error('Error inserting log into ClickHouse:', error)
    throw error
  }
}

/**
 * Insert multiple log entries into ClickHouse (batch insert)
 */
export async function insertLogs(logs: Array<{
  projectId: string
  service: string
  container: string
  level: string
  message: string
  labels?: Record<string, string>
  metadata?: string
  timestamp?: Date
}>): Promise<void> {
  const client = getClickHouseClient()
  
  try {
    const values = logs.map(log => ({
      timestamp: log.timestamp || new Date(),
      projectId: log.projectId,
      service: log.service,
      container: log.container,
      level: log.level,
      message: log.message,
      labels: JSON.stringify(log.labels || {}),
      metadata: log.metadata || ''
    }))
    
    await client.insert({
      table: 'logs',
      values,
      format: 'JSONEachRow'
    })
  } catch (error) {
    console.error('Error inserting logs into ClickHouse:', error)
    throw error
  }
}

/**
 * Delete all logs for a project from ClickHouse
 */
export async function deleteProjectLogs(projectId: string): Promise<void> {
  const client = getClickHouseClient()
  
  try {
    await client.command({
      query: `ALTER TABLE logs DELETE WHERE projectId = {projectId:String}`,
      query_params: { projectId }
    })
  } catch (error) {
    console.error(`Error deleting logs for project ${projectId}:`, error)
    throw error
  }
}

/**
 * Initialize ClickHouse database and tables
 */
export async function initializeClickHouse(): Promise<void> {
  try {
    const url = process.env.CLICKHOUSE_URL
    const username = process.env.CLICKHOUSE_USER
    const password = process.env.CLICKHOUSE_PASSWORD

    if (!url || !username || !password) {
      throw new Error(
        'ClickHouse configuration missing. Please set CLICKHOUSE_URL, CLICKHOUSE_USER, and CLICKHOUSE_PASSWORD environment variables.'
      )
    }

    // Create database if it doesn't exist (using default database)
    const defaultClient = createClient({
      url,
      username,
      password,
    })
    
    const database = process.env.CLICKHOUSE_DB
    if (!database) {
      throw new Error('CLICKHOUSE_DB environment variable is required')
    }
    
    await defaultClient.command({
      query: `CREATE DATABASE IF NOT EXISTS ${database}`
    })
    
    await defaultClient.close()
    
    // Now create tables in the database
    const client = getClickHouseClient()
    
    const initSql = `
      CREATE TABLE IF NOT EXISTS logs (
        timestamp DateTime64(3),
        projectId String,
        service String,
        container String,
        level String,
        message String,
        labels String DEFAULT '{}',
        metadata String DEFAULT '{}'
      ) ENGINE = MergeTree()
      PARTITION BY toYYYYMM(timestamp)
      ORDER BY (projectId, timestamp)
      SETTINGS index_granularity = 8192;
    `
    
    await client.command({ query: initSql })
    
    // Create materialized view (only if it doesn't exist)
    const mvSql = `
      CREATE MATERIALIZED VIEW IF NOT EXISTS logs_recent
      ENGINE = Memory
      AS SELECT * FROM logs
      WHERE timestamp > now() - INTERVAL 1 HOUR;
    `
    
    try {
      await client.command({ query: mvSql })
    } catch (error: any) {
      // Materialized view might already exist, ignore specific error
      if (!error.message?.includes('already exists')) {
        console.log('Materialized view creation note:', error.message)
      }
    }
    
    console.log('ClickHouse initialized successfully')
  } catch (error) {
    console.error('Error initializing ClickHouse:', error)
    // Don't throw - allow server to start even if ClickHouse isn't ready
    // Logs will fail gracefully if ClickHouse is unavailable
  }
}

// Export client for advanced usage
export { getClickHouseClient as client }

