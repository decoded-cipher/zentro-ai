import { Kafka, logLevel, type Producer, type CompressionTypes } from 'kafkajs'

export interface KafkaLogMessage {
  timestamp: string
  projectId: string
  service: string
  container: string
  level: string
  message: string
  labels?: Record<string, string>
  metadata?: string
}

function getKafkaConfig() {
  const brokersRaw = process.env.KAFKA_BROKERS || 'localhost:9092'
  const brokers = brokersRaw.split(',').map((s) => s.trim()).filter(Boolean)

  const clientId = process.env.KAFKA_CLIENT_ID || 'zentro-logger'
  const topic = process.env.KAFKA_LOGS_TOPIC || 'zentro.logs'

  return { brokers, clientId, topic }
}

let producerSingleton: Producer | null = null
let producerConnecting: Promise<Producer> | null = null

async function getProducer(): Promise<Producer> {
  if (producerSingleton) return producerSingleton
  if (producerConnecting) return producerConnecting

  const { brokers, clientId } = getKafkaConfig()
  const kafka = new Kafka({
    clientId,
    brokers,
    // keep KafkaJS quiet by default; can override with KAFKAJS_LOG_LEVEL
    logLevel: process.env.KAFKAJS_LOG_LEVEL
      ? (Number(process.env.KAFKAJS_LOG_LEVEL) as any)
      : logLevel.NOTHING,
  })

  const producer = kafka.producer({
    allowAutoTopicCreation: true,
    idempotent: false,
  })

  producerConnecting = (async () => {
    await producer.connect()
    producerSingleton = producer
    producerConnecting = null
    return producer
  })()

  return producerConnecting
}

export async function publishLog(message: KafkaLogMessage): Promise<void> {
  await publishLogs([message])
}

export async function publishLogs(messages: KafkaLogMessage[]): Promise<void> {
  if (messages.length === 0) return

  const { topic } = getKafkaConfig()
  const producer = await getProducer()

  await producer.send({
    topic,
    compression: (process.env.KAFKA_LOGS_COMPRESSION as unknown as CompressionTypes) ?? undefined,
    messages: messages.map((m) => ({
      key: m.projectId,
      value: JSON.stringify({
        ...m,
        labels: m.labels ? JSON.stringify(m.labels) : '{}',
      }),
      timestamp: String(new Date(m.timestamp).getTime()),
    })),
  })
}

export async function shutdownKafkaProducer(): Promise<void> {
  if (!producerSingleton) return
  await producerSingleton.disconnect()
  producerSingleton = null
}

