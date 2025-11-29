
import amqp, { Connection, Channel, ConsumeMessage } from 'amqplib';


export interface QueueMessage {
    type: string;
    data: Record<string, unknown>;
}

export type Handler = (message: QueueMessage, raw: ConsumeMessage) => Promise<void> | void;



let connection: Connection | null = null;
let channel: Channel | null = null;


// Generate the RabbitMQ connection URL
function getConnectionUrl(): string {
    return `amqp://${process.env.RABBITMQ_USERNAME}:${process.env.RABBITMQ_PASSWORD}@${process.env.RABBITMQ_HOST}:${process.env.RABBITMQ_PORT}`;
}


// Get or create a channel
async function getChannel(): Promise<Channel> {
  if (!connection) {
    connection = await amqp.connect(getConnectionUrl());
    connection.on('error', () => { connection = null; });
    connection.on('close', () => { connection = null; channel = null; });
  }
  if (!channel) {
    channel = await connection.createChannel();
    channel.on('error', () => { channel = null; });
    channel.on('close', () => { channel = null; });
  }
  return channel;
}


// Publish a message to an exchange with a routing key
export async function publish(
  exchange: string,
  routingKey: string,
  message: QueueMessage
): Promise<boolean> {
  const ch = await getChannel();
  await ch.assertExchange(exchange, 'topic', { durable: true });
  return ch.publish(exchange, routingKey, Buffer.from(JSON.stringify(message)), {
    persistent: true,
  });
}


// Consume messages from a queue
export async function consume(
  queue: string,
  exchange: string,
  routingKey: string,
  handler: Handler
): Promise<void> {
  const ch = await getChannel();
  await ch.assertExchange(exchange, 'topic', { durable: true });
  await ch.assertQueue(queue, { durable: true });
  await ch.bindQueue(queue, exchange, routingKey);
  
  await ch.consume(queue, async (msg) => {
    if (!msg) return;
    try {
      const parsed = JSON.parse(msg.content.toString()) as QueueMessage;
      if (parsed) await handler(parsed, msg);
      ch.ack(msg);
    } catch (error) {
      ch.nack(msg, false, true);
    }
  });
}


// Close the connection and channel
export async function close(): Promise<void> {
  if (channel) await channel.close();
  if (connection) await connection.close();
  channel = null;
  connection = null;
}
