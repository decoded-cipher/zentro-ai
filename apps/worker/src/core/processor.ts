
import Anthropic from "@anthropic-ai/sdk";
import { eq, asc } from 'drizzle-orm';

import { db, prompt as promptTable, withDefaults } from '@repo/db';
import { getSystemPrompt } from '../helpers/prompts';
import { broadcastToSSE } from '../helpers/sse';

import { parseArtifacts, extractNonArtifactText } from './parser';
import { executeArtifact } from './executor';


const anthropic = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY || '' });
const BASE_WORK_DIR = '/tmp/zentro';



// Processes a chat prompt for a given project
export async function processChat(projectId: string, promptText: string) {
    try {

        // 1. Save user prompt
        await db.insert(promptTable).values(withDefaults({
            projectId,
            text: promptText,
            type: 'USER'
        })).execute();

        // 2. Get conversation history (excluding the message we just added)
        const allMessages = await db
            .select()
            .from(promptTable)
            .where(eq(promptTable.projectId, projectId))
            .orderBy(asc(promptTable.createdAt));

        // 3. Convert to Claude format - the API expects an array of message objects
        const messages = allMessages.map(msg => ({
            role: msg.type === 'USER' ? 'user' : 'assistant' as const,
            content: msg.text
        }));

        // 4. Add the new user prompt
        const systemPrompt = getSystemPrompt(BASE_WORK_DIR);
        
        // 5. Call Claude API with streaming
        let fullResponse = "";
        const stream = await anthropic.messages.stream({
            model: process.env.CLAUDE_MODEL_NAME! || '',
            max_tokens: Number(process.env.CLAUDE_MAX_TOKENS!),
            system: systemPrompt,
            messages: messages,
        });

        // Handle streaming response
        for await (const chunk of stream) {
            if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
                const content = chunk.delta.text;
                if (content) {
                    fullResponse += content;
                    broadcastToSSE({
                        projectId,
                        content,
                        type: 'content'
                    });
                }
            }
        }

        // 6. Save assistant response
        await db.insert(promptTable).values(withDefaults({
            projectId,
            text: fullResponse.trim(),
            type: 'ASSISTANT'
        })).execute();

        // 7. Parse and execute artifacts
        const artifacts = parseArtifacts(fullResponse);
        
        if (artifacts.length > 0) {
            broadcastToSSE({
                projectId,
                type: 'artifact_detected',
                content: `Found ${artifacts.length} artifact(s) to execute`
            });

            for (const artifact of artifacts) {
                broadcastToSSE({
                    projectId,
                    type: 'artifact_executing',
                    content: `Executing artifact: ${artifact.title}`
                });

                const result = await executeArtifact(projectId, artifact.actions);
                
                if (result.success) {
                    broadcastToSSE({
                        projectId,
                        type: 'artifact_complete',
                        content: `Artifact "${artifact.title}" executed successfully`
                    });
                } else {
                    broadcastToSSE({
                        projectId,
                        type: 'artifact_error',
                        content: `Some actions in artifact "${artifact.title}" failed. Check logs for details.`
                    });
                }
            }
        }

        // 8. Notify completion
        broadcastToSSE({
            projectId,
            type: 'done'
        });

    } catch (error) {
        console.error("Error processing chat:", error);
        broadcastToSSE({
            projectId,
            content: `Error processing request: ${error instanceof Error ? error.message : String(error)}`,
            type: 'content'
        });

        // 8. Notify completion
        broadcastToSSE({
            projectId,
            type: 'done'
        });
    }
}
