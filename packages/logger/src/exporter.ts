import { ExportResult, ExportResultCode } from '@opentelemetry/core'
import { ReadableLogRecord, LogRecordExporter } from '@opentelemetry/sdk-logs'
import { publishLogs, type KafkaLogMessage } from './kafka'

interface KafkaExporterConfig {
  projectId?: string
  service: string
  container: string
}

export class KafkaLogExporter implements LogRecordExporter {
  private config: KafkaExporterConfig
  private logBuffer: ReadableLogRecord[] = []
  private batchSize: number = 100
  private flushInterval: number = 5000 // 5 seconds
  private flushTimer: NodeJS.Timeout | null = null

  constructor(config: KafkaExporterConfig) {
    this.config = config
    this.startFlushTimer()
  }

  private startFlushTimer() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
    }

    this.flushTimer = setInterval(() => {
      this.flush()
    }, this.flushInterval)
  }

  export(logs: ReadableLogRecord[], resultCallback: (result: ExportResult) => void): void {
    try {
      // Add logs to buffer
      this.logBuffer.push(...logs)

      // Flush if buffer is full
      if (this.logBuffer.length >= this.batchSize) {
        this.flush()
      }

      resultCallback({ code: ExportResultCode.SUCCESS })
    } catch (error) {
      console.error('Error exporting logs:', error)
      resultCallback({ code: ExportResultCode.FAILURE })
    }
  }

  async flush(): Promise<void> {
    if (this.logBuffer.length === 0) {
      return
    }

    const logsToFlush = this.logBuffer.splice(0, this.batchSize)

    try {
      // Convert OpenTelemetry log records to Kafka messages
      const kafkaMessages: KafkaLogMessage[] = []
      for (const log of logsToFlush) {
        const attributes = log.attributes || {}
        const projectId = (attributes['zentro.project.id'] as string) || this.config.projectId
        const container = (attributes['zentro.container'] as string) || this.config.container
        const service = (attributes['zentro.service'] as string) || this.config.service

        if (!projectId) {
          // Skip logs without project ID
          continue
        }

        // Extract message from body
        let message = ''
        if (typeof log.body === 'string') {
          message = log.body
        } else if (log.body && typeof log.body === 'object') {
          message = JSON.stringify(log.body)
        }

        // Build labels from attributes (exclude internal ones)
        const labels: Record<string, string> = {}
        Object.entries(attributes).forEach(([key, value]) => {
          if (!key.startsWith('zentro.')) {
            labels[key] = String(value || '')
          }
        })

        // Build metadata
        const metadata: Record<string, any> = {
          severityNumber: log.severityNumber,
          severityText: log.severityText,
          traceId: log.spanContext?.traceId,
          spanId: log.spanContext?.spanId,
        }

        kafkaMessages.push({
          timestamp: new Date().toISOString(),
          projectId,
          service,
          container,
          level: this.severityToLevel(log.severityNumber),
          message,
          labels,
          metadata: JSON.stringify(metadata),
        })
      }

      await publishLogs(kafkaMessages)
    } catch (error) {
      console.error('Error flushing logs to Kafka:', error)
      // Put logs back in buffer to retry later
      this.logBuffer.unshift(...logsToFlush)
    }
  }

  private severityToLevel(severityNumber: number): string {
    // OpenTelemetry severity numbers
    if (severityNumber >= 17) return 'error' // ERROR (17-24)
    if (severityNumber >= 13) return 'warn'  // WARN (13-16)
    if (severityNumber >= 9) return 'info'   // INFO (9-12)
    if (severityNumber >= 5) return 'debug'  // DEBUG (5-8)
    return 'trace' // TRACE (1-4)
  }

  shutdown(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
      this.flushTimer = null
    }
    return this.flush()
  }
}

