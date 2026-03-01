/**
 * Master catalog of LLM providers and their models.
 * - Anthropic: available by default (uses server env key), 3 models enabled by default
 * - All other providers: blocked until user adds API key, then 3 models enabled by default
 * - User can enable more models from Settings > Models
 */

export interface ModelCatalogItem {
  id: string
  label: string
  /** When true, model is deprecated or not yet available */
  disabled?: boolean
}

export interface ProviderCatalog {
  providerId: string
  name: string
  /** True if this provider uses server-side API key (e.g. Anthropic) - no user key needed */
  default: boolean
  /** Default 3 model IDs enabled when provider becomes available */
  defaultModelIds: string[]
  models: ModelCatalogItem[]
}

/** Provider availability state */
export type ProviderAvailability = 'available' | 'blocked' | 'needs_key' | 'offline'

/** Providers that support API keys (others are blocked / coming soon) */
export const AVAILABLE_PROVIDERS = new Set(['anthropic', 'google'])

/** Default model selection when no preference is set */
export const DEFAULT_MODEL_ID = 'claude-sonnet-4-5-20250929'

export const PROVIDER_CATALOG: ProviderCatalog[] = [
  {
    providerId: 'anthropic',
    name: 'Anthropic',
    default: true,
    defaultModelIds: [
      'claude-sonnet-4-5-20250929',
      'claude-opus-4-6',
      'claude-haiku-4-5-20251001',
    ],
    models: [
      { id: 'claude-opus-4-6', label: 'Claude Opus 4.6' },
      { id: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6' },
      { id: 'claude-sonnet-4-5-20250929', label: 'Claude Sonnet 4.5' },
      { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5' },
      { id: 'claude-opus-4-5-20251115', label: 'Claude Opus 4.5' },
      { id: 'claude-opus-4-20250514', label: 'Claude Opus 4' },
      { id: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4' },
      { id: 'claude-3-7-sonnet-latest', label: 'Claude 3.7 Sonnet' },
      { id: 'claude-3-7-sonnet-20250219', label: 'Claude 3.7 Sonnet (Feb 2025)' },
      { id: 'claude-3-5-sonnet-latest', label: 'Claude 3.5 Sonnet' },
      { id: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku' },
      { id: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
      { id: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet' },
      { id: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' },
    ],
  },
  {
    providerId: 'google',
    name: 'Google',
    default: false,
    defaultModelIds: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash'],
    models: [
      { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
      { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
      { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
      { id: 'gemini-2.0-flash-lite', label: 'Gemini 2.0 Flash Lite' },
      { id: 'gemini-1.5-pro-latest', label: 'Gemini 1.5 Pro' },
      { id: 'gemini-1.5-flash-latest', label: 'Gemini 1.5 Flash' },
      { id: 'gemini-1.5-flash-8b-latest', label: 'Gemini 1.5 Flash 8B' },
      { id: 'gemini-pro', label: 'Gemini 1.0 Pro' },
    ],
  },
  {
    providerId: 'mistral',
    name: 'Mistral AI',
    default: false,
    defaultModelIds: ['mistral-large-latest', 'open-mistral-nemo', 'codestral-latest'],
    models: [
      { id: 'mistral-large-latest', label: 'Mistral Large 2' },
      { id: 'pixtral-large-latest', label: 'Pixtral Large' },
      { id: 'pixtral-12b', label: 'Pixtral 12B' },
      { id: 'open-mistral-nemo', label: 'Mistral Nemo' },
      { id: 'codestral-latest', label: 'Codestral' },
      { id: 'magistral-medium-2506', label: 'Magistral Medium 2506' },
      { id: 'mistral-small-latest', label: 'Mistral Small' },
      { id: 'Mistral-7B-Instruct-v0.1', label: 'Mistral 7B Instruct' },
      { id: 'Mixtral-8x7B-Instruct-v0.1', label: 'Mixtral 8x7B Instruct' },
    ],
  },
  {
    providerId: 'deepseek',
    name: 'DeepSeek',
    default: false,
    defaultModelIds: ['deepseek-chat', 'deepseek-reasoner', 'deepseek-v3'],
    models: [
      { id: 'deepseek-chat', label: 'DeepSeek Chat' },
      { id: 'deepseek-reasoner', label: 'DeepSeek Reasoner' },
      { id: 'deepseek-v3', label: 'DeepSeek V3' },
      { id: 'deepseek-r1', label: 'DeepSeek R1' },
      { id: 'deepseek-coder', label: 'DeepSeek Coder' },
    ],
  },
  {
    providerId: 'xai',
    name: 'xAI',
    default: false,
    defaultModelIds: ['grok-4', 'grok-3-mini-beta', 'grok-3-beta'],
    models: [
      { id: 'grok-4', label: 'Grok 4' },
      { id: 'grok-4-fast-reasoning', label: 'Grok 4 Fast Reasoning' },
      { id: 'grok-4-fast-non-reasoning', label: 'Grok 4 Fast Non-Reasoning' },
      { id: 'grok-3-beta', label: 'Grok 3 Beta' },
      { id: 'grok-3-mini-beta', label: 'Grok 3 Mini Beta' },
      { id: 'grok-3-fast-beta', label: 'Grok 3 Fast Beta' },
      { id: 'grok-2-1212', label: 'Grok 2 1212' },
      { id: 'grok-beta', label: 'Grok Beta' },
    ],
  },
  {
    providerId: 'cohere',
    name: 'Cohere',
    default: false,
    defaultModelIds: ['command-r-plus', 'command-r', 'command-r-08-2024'],
    models: [
      { id: 'command-r-plus', label: 'Command R+' },
      { id: 'command-r', label: 'Command R' },
      { id: 'command-r-08-2024', label: 'Command R 08 2024' },
      { id: 'command-a', label: 'Command A' },
      { id: 'command', label: 'Command' },
      { id: 'command-light', label: 'Command Light' },
    ],
  },
  {
    providerId: 'perplexity',
    name: 'Perplexity',
    default: false,
    defaultModelIds: ['sonar', 'sonar-pro', 'sonar-reasoning-pro'],
    models: [
      { id: 'sonar', label: 'Sonar' },
      { id: 'sonar-pro', label: 'Sonar Pro' },
      { id: 'sonar-reasoning-pro', label: 'Sonar Reasoning Pro' },
      { id: 'sonar-reasoning', label: 'Sonar Reasoning' },
    ],
  },
  {
    providerId: 'meta',
    name: 'Meta (Llama)',
    default: false,
    defaultModelIds: ['meta-llama/Llama-3.3-70B-Instruct-Turbo', 'meta-llama/Llama-3.1-70B-Instruct-Turbo', 'meta-llama/Llama-3.1-8B-Instruct-Turbo'],
    models: [
      { id: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', label: 'Llama 3.3 70B' },
      { id: 'meta-llama/Llama-3.2-90B-Vision-Instruct-Turbo', label: 'Llama 3.2 90B Vision' },
      { id: 'meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo', label: 'Llama 3.2 11B Vision' },
      { id: 'meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo', label: 'Llama 3.1 405B' },
      { id: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo', label: 'Llama 3.1 70B' },
      { id: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo', label: 'Llama 3.1 8B' },
      { id: 'meta-llama/Llama-3-70b-chat-hf', label: 'Llama 3 70B' },
      { id: 'meta-llama/Llama-3-8b-chat-hf', label: 'Llama 3 8B' },
      { id: 'meta-llama/Llama-2-13b-chat-hf', label: 'Llama 2 13B' },
    ],
  },
  {
    providerId: 'together',
    name: 'Together AI',
    default: false,
    defaultModelIds: [
      'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
      'deepseek-ai/DeepSeek-V3',
      'Qwen/Qwen2.5-72B-Instruct-Turbo',
    ],
    models: [
      { id: 'meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8', label: 'Llama 4 Maverick 17B' },
      { id: 'meta-llama/Llama-4-Scout-17B-16E-Instruct', label: 'Llama 4 Scout 17B' },
      { id: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', label: 'Llama 3.3 70B' },
      { id: 'meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo', label: 'Llama 3.1 405B' },
      { id: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo', label: 'Llama 3.1 70B' },
      { id: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo', label: 'Llama 3.1 8B' },
      { id: 'deepseek-ai/DeepSeek-V3', label: 'DeepSeek V3' },
      { id: 'Qwen/Qwen2.5-72B-Instruct-Turbo', label: 'Qwen 2.5 72B' },
      { id: 'Qwen/Qwen2.5-VL-72B-Instruct', label: 'Qwen 2.5 VL 72B' },
      { id: 'mistralai/Mixtral-8x7B-Instruct-v0.1', label: 'Mixtral 8x7B' },
      { id: 'mistralai/Mistral-7B-Instruct-v0.1', label: 'Mistral 7B' },
    ],
  },
  {
    providerId: 'groq',
    name: 'Groq',
    default: false,
    defaultModelIds: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'llama3-70b-8192'],
    models: [
      { id: 'llama-4-maverick-17b-128e-instruct', label: 'Llama 4 Maverick 17B' },
      { id: 'llama-4-scout-17b-16e-instruct', label: 'Llama 4 Scout 17B' },
      { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B' },
      { id: 'llama-3.1-70b-versatile', label: 'Llama 3.1 70B' },
      { id: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B' },
      { id: 'llama3-70b-8192', label: 'Llama 3 70B' },
      { id: 'llama3-8b-8192', label: 'Llama 3 8B' },
      { id: 'deepseek-r1-distill-llama-70b', label: 'DeepSeek R1 Distill Llama 70B' },
      { id: 'gemma2-9b-it', label: 'Gemma 2 9B' },
    ],
  },
  {
    providerId: 'fireworks',
    name: 'Fireworks AI',
    default: false,
    defaultModelIds: ['llama-v3p1-70b-instruct', 'deepseek-v3', 'qwen2p5-72b-instruct'],
    models: [
      { id: 'llama4-maverick-instruct-basic', label: 'Llama 4 Maverick' },
      { id: 'llama4-scout-instruct-basic', label: 'Llama 4 Scout' },
      { id: 'llama-v3p3-70b-instruct', label: 'Llama 3.3 70B' },
      { id: 'llama-v3p1-405b-instruct', label: 'Llama 3.1 405B' },
      { id: 'llama-v3p1-70b-instruct', label: 'Llama 3.1 70B' },
      { id: 'llama-v3p1-8b-instruct', label: 'Llama 3.1 8B' },
      { id: 'deepseek-v3', label: 'DeepSeek V3' },
      { id: 'qwen2p5-72b-instruct', label: 'Qwen 2.5 72B' },
      { id: 'llama-v3p2-3b-instruct', label: 'Llama 3.2 3B' },
      { id: 'llama-v3p2-1b-instruct', label: 'Llama 3.2 1B' },
    ],
  },
  {
    providerId: 'openrouter',
    name: 'OpenRouter',
    default: false,
    defaultModelIds: [
      'anthropic/claude-3.5-sonnet',
      'openai/gpt-4o',
      'google/gemini-2.0-flash-001',
    ],
    models: [
      { id: 'anthropic/claude-3.7-sonnet', label: 'Claude 3.7 Sonnet' },
      { id: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet' },
      { id: 'openai/gpt-4o', label: 'GPT-4o' },
      { id: 'openai/o1', label: 'o1' },
      { id: 'google/gemini-2.0-flash-001', label: 'Gemini 2.0 Flash' },
      { id: 'xai/grok-4', label: 'Grok 4' },
      { id: 'deepseek/deepseek-chat-v3-0324', label: 'DeepSeek Chat V3' },
      { id: 'deepseek/deepseek-r1:free', label: 'DeepSeek R1 (Free)' },
      { id: 'mistralai/mistral-nemo', label: 'Mistral Nemo' },
      { id: 'cohere/command-a', label: 'Cohere Command A' },
    ],
  },
  {
    providerId: 'local',
    name: 'Local (Ollama)',
    default: true,
    defaultModelIds: [],
    models: [],
  },
]

/** Providers we have LLM implementation for in @repo/llm */
export const IMPLEMENTED_PROVIDERS = new Set([
  'anthropic',
  'google',
])

export function getProviderCatalog(providerId: string): ProviderCatalog | undefined {
  return PROVIDER_CATALOG.find((p) => p.providerId === providerId)
}

export function getModelFromCatalog(providerId: string, modelId: string): ModelCatalogItem | undefined {
  const provider = getProviderCatalog(providerId)
  return provider?.models.find((m) => m.id === modelId)
}
