import { consume, type QueueMessage } from '@repo/queue';
import { redis } from '@repo/redis';

const QUEUE_NAME = 'chat_queue';
const EXCHANGE_NAME = 'chat_exchange';
const ROUTING_KEY = 'chat.message';

console.log('Worker starting...');

async function handleMessage(message: QueueMessage) {
    console.log('Received message:', message);
    const { projectId, prompt } = message.data as { projectId: string, prompt: string };

    if (!projectId || !prompt) {
        console.error('Invalid message data');
        return;
    }

    // Simulate streaming
    const response = "This is a dummy response from the worker. I am streaming this content to you.";
    const chunks = response.split(' ');

    for (const chunk of chunks) {
        await new Promise(resolve => setTimeout(resolve, 200)); // Simulate delay
        const payload = {
            projectId,
            content: chunk + ' ',
            type: 'content'
        };
        await redis.publish(`chat:${projectId}`, JSON.stringify(payload));
    }
    
    // Send completion message
    await redis.publish(`chat:${projectId}`, JSON.stringify({
        projectId,
        type: 'done'
    }));
}

async function start() {
    try {
        await consume(QUEUE_NAME, EXCHANGE_NAME, ROUTING_KEY, handleMessage);
        console.log('Worker is listening for messages...');
    } catch (error) {
        console.error('Failed to start worker:', error);
        process.exit(1);
    }
}

start();