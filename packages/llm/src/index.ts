
export type { LLMProvider, Message, CompletionOptions, CompletionResult, StreamEvent } from './provider';

import { createAnthropicProvider } from './providers/anthropic';
import { createGoogleProvider } from './providers/google';


// ──────────────────────────────────────────────
// Provider registry
//
// Add new providers here as they are implemented.
// e.g. 'openai', 'ollama', 'openrouter'
// ──────────────────────────────────────────────

const PROVIDERS = {
  anthropic: createAnthropicProvider,
  google: createGoogleProvider,
} as const;

type ProviderName = keyof typeof PROVIDERS;


// Config shapes per provider
interface ProviderConfigs {
  anthropic: { apiKey: string };
  google: { apiKey: string };
  // openai:     { apiKey: string };
  // ollama:     { baseUrl?: string };
  // openrouter: { apiKey: string };
}


/**
 * Create an LLM provider instance.
 *
 * Usage:
 *   const llm = createProvider('anthropic', { apiKey: '...' })
 *   const result = await llm.complete({ model: 'claude-sonnet-4-5-20250929', ... })
 */
export function createProvider<T extends ProviderName>(
  name: T,
  config: ProviderConfigs[T],
) {
  const factory = PROVIDERS[name];
  if (!factory) {
    throw new Error(`Unknown LLM provider: "${name}". Available: ${Object.keys(PROVIDERS).join(', ')}`);
  }
  return factory(config as any);
}
