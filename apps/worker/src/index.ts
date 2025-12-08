import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import apiRouter from './routes';
import { consume } from '@repo/queue';
import { processChat } from './core/processor';

dotenv.config();

const app = express();
const PORT = 9091;
const PROJECT_ID = process.env.PROJECT_ID;

app.use(cors());
app.use(express.json());

app.use('/', apiRouter);


async function start() {
    const QUEUE_NAME = `chat_queue_${PROJECT_ID}`;
    const EXCHANGE_NAME = 'chat_exchange';
    const ROUTING_KEY = `chat.message.${PROJECT_ID}`;

    console.log(`Worker listening on ${QUEUE_NAME} and port ${PORT}...`);

    consume(QUEUE_NAME, EXCHANGE_NAME, ROUTING_KEY, async (message) => {
        const { projectId, prompt } = message.data as { projectId: string, prompt: string };
        if (projectId && prompt) {
            await processChat(projectId, prompt);
        }
    }).catch(console.error);

    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Worker server running on http://0.0.0.0:${PORT}`);
    });
}

start();
