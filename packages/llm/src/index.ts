
export type { LLMProvider, Message, CompletionOptions, CompletionResult, StreamEvent } from './provider';

import { createAnthropicProvider } from './providers/anthropic';
import { createGoogleProvider } from './providers/google';

export { PROVIDER_CATALOG, DEFAULT_MODEL_ID, AVAILABLE_PROVIDERS, getProviderCatalog, getModelFromCatalog } from './catalog';
export type { ProviderCatalog, ModelCatalogItem, ProviderAvailability } from './catalog';

// ──────────────────────────────────────────────
// Provider registry (OpenAI can be added in future)
// ──────────────────────────────────────────────

const PROVIDERS = {
  anthropic: createAnthropicProvider,
  google: createGoogleProvider,
} as const;

type ProviderName = keyof typeof PROVIDERS;

interface ProviderConfigs {
  anthropic: { apiKey: string };
  google: { apiKey: string };
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
