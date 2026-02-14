
import Anthropic from "@anthropic-ai/sdk";
import { eq, asc } from 'drizzle-orm';

import { db, project as projectTable, prompt as promptTable, withDefaults } from '@repo/db';
import { getSystemPrompt } from '../helpers/prompts';
import { broadcastToSSE } from '../helpers/sse';

import { parseArtifacts, extractNonArtifactText } from './parser';
import { executeArtifact } from './executor';


const anthropic = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY || '' });
const BASE_WORK_DIR = '/tmp/zentro';
const maxTokens = Number(process.env.CLAUDE_MAX_TOKENS!);



// Generate project name from prompt
async function generateProjectName(projectId: string, promptText: string) {
    try {
        const msg = await anthropic.messages.create({
            model: process.env.CLAUDE_UTILITY_MODEL! || '',
            max_tokens: 50,
            messages: [{
                role: 'user',
                content: `Generate a short project name (2-5 words) for this request. Reply with ONLY the name, no quotes or punctuation: ${promptText.slice(0, 500)}`
            }]
        });
        const block = msg.content[0];
        const raw = block && 'text' in block ? block.text : '';
        const name = raw.trim().slice(0, 100) || 'New Project';
        const now = Math.floor(Date.now() / 1000);
        await db.update(projectTable).set({ name, updatedAt: now }).where(eq(projectTable.id, projectId));
    } catch (e) {
        console.error('Failed to generate project name:', e);
    }
}



// Processes a chat prompt for a given project
export async function processChat(projectId: string, promptText: string) {
    try {
        // 1. Save user prompt
        const [userPrompt] = await db.insert(promptTable).values(withDefaults({
            projectId,
            text: promptText,
            type: 'USER',
            tokens: null,
        })).returning();

        // 2. Get conversation history (including the message we just added)
        const allMessages = await db
            .select()
            .from(promptTable)
            .where(eq(promptTable.projectId, projectId))
            .orderBy(asc(promptTable.createdAt));

        // 3. Generate project name
        if (allMessages.length === 1) {
            generateProjectName(projectId, promptText);
        }

        // 4. Convert to Claude format - the API expects an array of message objects
        const messages = allMessages.map(msg => ({
            role: msg.type === 'USER' ? 'user' : 'assistant' as const,
            content: msg.text
        }));

        // 5. Add the new user prompt
        const systemPrompt = getSystemPrompt(BASE_WORK_DIR, maxTokens);
        
        // 6. Call Claude API with streaming
        let fullResponse = "";
        const stream = await anthropic.messages.stream({
            model: process.env.CLAUDE_REASONING_MODEL! || '',
            max_tokens: maxTokens,
            system: systemPrompt,
            messages: messages,
        });

        let userInputTokens: number | null = null;
        let assistantOutputTokens: number | null = null;
        
        for await (const chunk of stream) {
            if (chunk.type === 'message_start' && chunk.message?.usage?.input_tokens != null) {
                userInputTokens = chunk.message.usage.input_tokens;
            }
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
            if (chunk.type === 'message_delta' && chunk.usage?.output_tokens != null) {
                assistantOutputTokens = chunk.usage.output_tokens;
            }
        }

        // 7. Update user prompt with input tokens
        if (userPrompt?.id && userInputTokens != null) {
            await db.update(promptTable).set({ tokens: userInputTokens, updatedAt: Math.floor(Date.now() / 1000) }).where(eq(promptTable.id, userPrompt.id));
        }

        // 8. Save assistant response
        await db.insert(promptTable).values(withDefaults({
            projectId,
            text: fullResponse.trim(),
            type: 'ASSISTANT',
            tokens: assistantOutputTokens,
        })).execute();

        // 9. Parse and execute artifacts
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

        // 9. Notify completion
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

        // 9. Notify completion
        broadcastToSSE({
            projectId,
            type: 'done'
        });
    }
}
