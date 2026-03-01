
import { eq, asc } from 'drizzle-orm';

import { createProvider } from '@repo/llm';
import { decryptApiKey } from '@repo/crypto';
import { db, project as projectTable, prompt as promptTable, apiKey, withDefaults } from '@repo/db';

import { getSystemPrompt } from '../helpers/prompts';
import { broadcastToSSE } from '../helpers/sse';
import { parseArtifacts } from './parser';
import { executeArtifact } from './executor';


const BASE_WORK_DIR = '/tmp/zentro';
const maxTokens = Number(process.env.CLAUDE_MAX_TOKENS || 0);

const DEFAULT_PROVIDER = 'anthropic';
const DEFAULT_MODEL = process.env.CLAUDE_REASONING_MODEL || '';
const DEFAULT_PROVIDER_KEY = process.env.CLAUDE_API_KEY || '';

const providerCache = new Map();



// Get API key to use for a given provider
async function resolveApiKey(providerName) {
  const rows = await db
    .select({ encryptedKey: apiKey.encryptedKey, active: apiKey.active })
    .from(apiKey)
    .where(eq(apiKey.providerId, providerName));

  const activeRow = rows.find((r) => r.active === 1);
  if (activeRow) return decryptApiKey(activeRow.encryptedKey);

  if (providerName === 'anthropic') return DEFAULT_PROVIDER_KEY;
  throw new Error(`No API key for provider: ${providerName}. Add your key in Settings > Models.`);
}

function getProvider(providerName, apiKey) {
  const name = providerName || DEFAULT_PROVIDER;
  const cacheKey = `${name}:${apiKey.slice(0, 8)}`;
  if (providerCache.has(cacheKey)) return providerCache.get(cacheKey);

  const provider = createProvider(name, { apiKey });
  providerCache.set(cacheKey, provider);
  return provider;
}



// Generates a project name based on user's prompt
async function generateProjectName(projectId, promptText, providerName, apiKey) {
    try {
        const llm = getProvider(providerName, apiKey);
        const model = providerName === 'anthropic'
            ? (process.env.CLAUDE_UTILITY_MODEL || DEFAULT_MODEL)
            : DEFAULT_MODEL;

        const result = await llm.complete({
            model,
            maxTokens: 50,
            messages: [{
                role: 'user',
                content: `Generate a short project name (2-5 words) for this request. Reply with ONLY the name, no quotes or punctuation: ${promptText.slice(0, 500)}`
            }]
        });
        const name = result.text.trim().slice(0, 100) || 'New Project';
        const now = Math.floor(Date.now() / 1000);
        await db.update(projectTable).set({ name, updatedAt: now }).where(eq(projectTable.id, projectId));
    } catch (e) {
        console.error('Failed to generate project name:', e);
    }
}



// Processes a chat prompt for a given project
export async function processChat(projectId, promptText) {
    try {
        
        // 1. Get provider + model preference
        const [projectRow] = await db
            .select({ model: projectTable.model })
            .from(projectTable)
            .where(eq(projectTable.id, projectId))
            .limit(1);
        
        const modelConfig = projectRow?.model;
        const providerName = modelConfig?.provider || DEFAULT_PROVIDER;
        const reasoningModel = modelConfig?.name || DEFAULT_MODEL;

        const key = await resolveApiKey(providerName);
        if (!key) throw new Error(`No API key for provider: ${providerName}. Add your key in Settings > Models.`);
        const llm = getProvider(providerName, key);

        // 2. Save user prompt
        const [userPrompt] = await db.insert(promptTable).values(withDefaults({
            projectId,
            text: promptText,
            type: 'USER',
            tokens: null,
        })).returning();

        // 3. Get conversation history (including the message we just added)
        const allMessages = await db
            .select()
            .from(promptTable)
            .where(eq(promptTable.projectId, projectId))
            .orderBy(asc(promptTable.createdAt));

        // 4. Generate project name
        if (allMessages.length === 1) {
            generateProjectName(projectId, promptText, providerName, key);
        }

        // 5. Convert to message format
        const messages = allMessages.map(msg => ({
            role: msg.type === 'USER' ? 'user' : 'assistant',
            content: msg.text
        }));

        // 6. Add the new user prompt
        const systemPrompt = getSystemPrompt(BASE_WORK_DIR, maxTokens);
        
        // 7. Call LLM with streaming
        let fullResponse = "";
        let userInputTokens = null;
        let assistantOutputTokens = null;

        for await (const event of llm.stream({
            model: reasoningModel,
            maxTokens,
            system: systemPrompt,
            messages,
        })) {
            if (event.type === 'text') {
                fullResponse += event.text;
                broadcastToSSE({ projectId, content: event.text, type: 'content' });
            }
            if (event.type === 'usage') {
                userInputTokens = event.inputTokens;
                assistantOutputTokens = event.outputTokens;
            }
        }

        // 8. Update user prompt with input tokens
        if (userPrompt?.id && userInputTokens != null) {
            await db.update(promptTable).set({ tokens: userInputTokens, updatedAt: Math.floor(Date.now() / 1000) }).where(eq(promptTable.id, userPrompt.id));
        }

        // 9. Save assistant response
        await db.insert(promptTable).values(withDefaults({
            projectId,
            text: fullResponse.trim(),
            type: 'ASSISTANT',
            tokens: assistantOutputTokens,
        })).execute();

        // 10. Parse and execute artifacts
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

        // 11. Notify completion
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

        // 11. Notify completion
        broadcastToSSE({
            projectId,
            type: 'done'
        });
    }
}
