import express from 'express';
import cors from 'cors';
import { consume } from '@repo/queue';
import { redis } from '@repo/redis';
import { db, prompt as promptTable, withDefaults } from '@repo/db';
import { GoogleGenAI } from "@google/genai";

const app = express();
app.use(cors());
app.use(express.json());

const PROJECT_ID = process.env.PROJECT_ID;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const PORT = 9091;

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
const sseClients = new Set<express.Response>();

function broadcastToSSE(data: any) {
    const message = `data: ${JSON.stringify(data)}\n\n`;
    for (const client of sseClients) {
        client.write(message);
    }
}

async function processChat(projectId: string, promptText: string) {
    try {
        await db.insert(promptTable).values(withDefaults({
            projectId,
            text: promptText,
            type: 'USER'
        })).execute();

        let fullResponse = "";
        const response = await ai.models.generateContentStream({
            model: "gemini-2.5-flash",
            contents: promptText,
        });

        for await (const chunk of response) {
            const content = chunk.text;
            if (content) {
                fullResponse += content;
                const payload = {
                    projectId,
                    content,
                    type: 'content'
                };
                broadcastToSSE(payload);
            }
        }

        await db.insert(promptTable).values(withDefaults({
            projectId,
            text: fullResponse.trim(),
            type: 'ASSISTANT'
        })).execute();

        const donePayload = {
            projectId,
            type: 'done'
        };
        broadcastToSSE(donePayload);

    } catch (error) {
        console.error("Error processing chat:", error);
        const errorPayload = {
            projectId,
            content: "Error processing request",
            type: 'content'
        };
        broadcastToSSE(errorPayload);
        
        const donePayload = {
            projectId,
            type: 'done'
        };
        broadcastToSSE(donePayload);
    }
}

app.get('/subscribe', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    sseClients.add(res);
    res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);

    req.on('close', () => {
        sseClients.delete(res);
    });
});

app.post('/chat', async (req, res) => {
    const { projectId, prompt } = req.body;
    if (!projectId || !prompt) {
        res.status(400).send('Missing projectId or prompt');
        return;
    }
    
    // Process in background
    processChat(projectId, prompt).catch(err => console.error(err));
    
    res.json({ status: 'processing' });
});

async function start() {
    const QUEUE_NAME = `chat_queue_${PROJECT_ID}`;
    const EXCHANGE_NAME = 'chat_exchange';
    const ROUTING_KEY = `chat.message.${PROJECT_ID}`;

    console.log(`Worker listening on ${QUEUE_NAME} and port ${PORT}...`);
    
    // Start HTTP server
    app.listen(PORT, () => {
        console.log(`HTTP server running on port ${PORT}`);
    });

    // Start Queue consumer
    await consume(QUEUE_NAME, EXCHANGE_NAME, ROUTING_KEY, async (message) => {
        const { projectId, prompt } = message.data as { projectId: string, prompt: string };
        if (projectId && prompt) {
            await processChat(projectId, prompt);
        }
    });
}

start();
