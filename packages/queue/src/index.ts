
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
    const user = process.env.RABBITMQ_USERNAME || 'rabbitmq';
    const pass = process.env.RABBITMQ_PASSWORD || 'rabbitmq';
    const host = process.env.RABBITMQ_HOST || 'localhost';
    const port = process.env.RABBITMQ_PORT || '5672';
    const url = `amqp://${user}:${pass}@${host}:${port}`;
    console.log(`[Queue] Connection URL: amqp://${user}:***@${host}:${port}`);
    return url;
}


// Get or create a channel
async function getChannel(): Promise<Channel> {
  if (!connection) {
    console.log('[Queue] Attempting to connect to RabbitMQ...');
    try {
      connection = await amqp.connect(getConnectionUrl());
      console.log('[Queue] Successfully connected to RabbitMQ');
      connection.on('error', (err) => { 
        console.error('[Queue] Connection error:', err);
        connection = null; 
      });
      connection.on('close', () => { 
        console.log('[Queue] Connection closed');
        connection = null; 
        channel = null; 
      });
    } catch (err) {
      console.error('[Queue] Failed to connect to RabbitMQ:', err);
      throw err;
    }
  }
  if (!channel) {
    console.log('[Queue] Creating channel...');
    channel = await connection.createChannel();
    console.log('[Queue] Channel created');
    channel.on('error', (err) => { 
      console.error('[Queue] Channel error:', err);
      channel = null; 
    });
    channel.on('close', () => { 
      console.log('[Queue] Channel closed');
      channel = null; 
    });
  }
  return channel;
}


// Ensure a queue exists and is bound to an exchange
export async function ensureQueue(
  queue: string,
  exchange: string,
  routingKey: string
): Promise<void> {
  const ch = await getChannel();
  await ch.assertExchange(exchange, 'topic', { durable: true });
  await ch.assertQueue(queue, { durable: true });
  await ch.bindQueue(queue, exchange, routingKey);
  console.log(`[Queue] Ensured queue ${queue} bound to ${exchange}/${routingKey}`);
}

// Publish a message to an exchange with a routing key
export async function publish(
  exchange: string,
  routingKey: string,
  message: QueueMessage
): Promise<boolean> {
  try {
    const ch = await getChannel();
    
    // Enable publisher confirms for reliable delivery
    await ch.confirmChannel?.();
    
    await ch.assertExchange(exchange, 'topic', { durable: true });
    
    const result = ch.publish(exchange, routingKey, Buffer.from(JSON.stringify(message)), {
      persistent: true,
    });
    
    // Wait for channel to drain if buffer is full
    if (!result) {
      await new Promise<void>((resolve) => ch.once('drain', resolve));
    }
    
    console.log(`[Queue] Published message to ${exchange}/${routingKey}:`, result);
    return true;
  } catch (error) {
    console.error(`[Queue] Failed to publish message to ${exchange}/${routingKey}:`, error);
    throw error;
  }
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
