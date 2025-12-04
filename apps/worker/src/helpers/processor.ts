import { GoogleGenAI } from "@google/genai";
import { db, prompt as promptTable, withDefaults } from '@repo/db';
import { broadcastToSSE } from './sse';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

export async function processChat(projectId: string, promptText: string) {
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
                broadcastToSSE({
                    projectId,
                    content,
                    type: 'content'
                });
            }
        }

        await db.insert(promptTable).values(withDefaults({
            projectId,
            text: fullResponse.trim(),
            type: 'ASSISTANT'
        })).execute();

        broadcastToSSE({
            projectId,
            type: 'done'
        });

    } catch (error) {
        console.error("Error processing chat:", error);
        broadcastToSSE({
            projectId,
            content: "Error processing request",
            type: 'content'
        });
        broadcastToSSE({
            projectId,
            type: 'done'
        });
    }
}
