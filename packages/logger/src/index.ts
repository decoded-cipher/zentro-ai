import { logs, SeverityNumber } from '@opentelemetry/api-logs'
import { Resource } from '@opentelemetry/resources'
import { SEMRESATTRS_SERVICE_NAME, SEMRESATTRS_SERVICE_VERSION } from '@opentelemetry/semantic-conventions'
import { LoggerProvider, SimpleLogRecordProcessor } from '@opentelemetry/sdk-logs'
import { KafkaLogExporter } from './exporter'

export interface LoggerConfig {
  serviceName: string
  serviceVersion?: string
  projectId?: string
  container?: string
  enabled?: boolean
}

export interface LogAttributes {
  [key: string]: string | number | boolean | undefined
}

class ZentroLogger {
  private logger: any
  private config: LoggerConfig
  private provider: LoggerProvider | null = null

  constructor(config: LoggerConfig) {
    this.config = { enabled: true, ...config }
    
    if (this.config.enabled) {
      this.initialize()
    }
  }

  private initialize() {
    try {
      const resource = new Resource({
        [SEMRESATTRS_SERVICE_NAME]: this.config.serviceName,
        [SEMRESATTRS_SERVICE_VERSION]: this.config.serviceVersion || '1.0.0',
      })

      this.provider = new LoggerProvider({
        resource,
      })

      // Add ClickHouse exporter
      const exporter = new KafkaLogExporter({
        projectId: this.config.projectId,
        service: this.config.serviceName,
        container: this.config.container || this.config.serviceName,
      })

      this.provider.addLogRecordProcessor(
        new SimpleLogRecordProcessor(exporter)
      )

      logs.setGlobalLoggerProvider(this.provider)

      this.logger = logs.getLogger(this.config.serviceName, this.config.serviceVersion)
    } catch (error) {
      console.error('Failed to initialize logger:', error)
      // Fallback to console logging if OpenTelemetry fails
      this.config.enabled = false
    }
  }

  private getSeverityNumber(level: string): SeverityNumber {
    const levelUpper = level.toUpperCase()
    if (levelUpper === 'ERROR' || levelUpper === 'ERR') return SeverityNumber.ERROR
    if (levelUpper === 'WARN' || levelUpper === 'WARNING') return SeverityNumber.WARN
    if (levelUpper === 'INFO') return SeverityNumber.INFO
    if (levelUpper === 'DEBUG') return SeverityNumber.DEBUG
    if (levelUpper === 'TRACE') return SeverityNumber.TRACE
    return SeverityNumber.INFO
  }

  private log(level: string, message: string, attributes?: LogAttributes) {
    // Determine projectId: use from attributes if provided, otherwise use config default
    const projectId = attributes?.projectId as string | undefined || this.config.projectId
    
    if (!this.config.enabled || !this.logger) {
      // Fallback to console with JSON format for consistency
      const consoleMethod = level.toLowerCase() === 'error' ? 'error' : 
                           level.toLowerCase() === 'warn' ? 'warn' : 
                           level.toLowerCase() === 'debug' ? 'debug' : 'log'
      
      const logEntry = {
        timestamp: new Date().toISOString(),
        level: level.toUpperCase(),
        service: this.config.serviceName,
        container: this.config.container || this.config.serviceName,
        projectId: projectId,
        message,
        ...(attributes && Object.fromEntries(
          Object.entries(attributes).filter(([key]) => key !== 'projectId')
        ))
      }
      console[consoleMethod](JSON.stringify(logEntry))
      return
    }

    try {
      // Build attributes object, excluding projectId from custom attributes since we handle it separately
      const customAttributes = { ...attributes }
      delete customAttributes.projectId
      
      this.logger.emit({
        severityNumber: this.getSeverityNumber(level),
        severityText: level.toUpperCase(),
        body: message,
        attributes: {
          ...customAttributes,
          'zentro.project.id': projectId,
          'zentro.container': this.config.container || this.config.serviceName,
          'zentro.service': this.config.serviceName,
        },
      })
    } catch (error) {
      console.error('Failed to emit log:', error)
    }
  }

  error(message: string, attributes?: LogAttributes) {
    this.log('error', message, attributes)
  }

  warn(message: string, attributes?: LogAttributes) {
    this.log('warn', message, attributes)
  }

  info(message: string, attributes?: LogAttributes) {
    this.log('info', message, attributes)
  }

  debug(message: string, attributes?: LogAttributes) {
    this.log('debug', message, attributes)
  }

  async shutdown() {
    if (this.provider) {
      await this.provider.shutdown()
    }
  }
}

// Export singleton instance factory
export function createLogger(config: LoggerConfig): ZentroLogger {
  return new ZentroLogger(config)
}

// Export types
export { ZentroLogger }

// Export ClickHouse functions and types
export {
  getClickHouseClient,
  createClickHouseClient,
  initializeClickHouse,
  queryLogs,
  getAllProjectLogs,
  deleteProjectLogs,
  client,
  type LogEntry,
  type LogQueryParams,
} from './clickhouse'

export {
  publishLog,
  publishLogs,
  shutdownKafkaProducer,
  type KafkaLogMessage,
} from './kafka'
