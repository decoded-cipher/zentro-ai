import { Hono } from 'hono'

export interface ModelItem {
  id: string
  label: string
  /** Optional base URL for local/remote endpoints */
  baseUrl?: string
  /** When true, model is shown but not selectable (coming soon) */
  disabled?: boolean
}

export interface ModelProvider {
  id: string
  name: string
  models: ModelItem[]
}

/** Default selection: Claude Sonnet. Only Anthropic models are available for now. */
export const DEFAULT_MODEL_ID = 'claude-sonnet-4-5-20250929'

const ANTHROPIC_MODELS: ModelItem[] = [
  { id: 'claude-sonnet-4-5-20250929', label: 'Claude Sonnet 4.5' },
  { id: 'claude-opus-4-6', label: 'Claude Opus 4.6' },
  { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5' },
]

const OPENAI_MODELS: ModelItem[] = [
  { id: 'gpt-4o', label: 'GPT-4o', disabled: true },
  { id: 'gpt-4o-mini', label: 'GPT-4o mini', disabled: true },
  { id: 'gpt-4-turbo', label: 'GPT-4 Turbo', disabled: true },
]

const GOOGLE_MODELS: ModelItem[] = [
  { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', disabled: true },
  { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro', disabled: true },
  { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash', disabled: true },
]

const META_MODELS: ModelItem[] = [
  { id: 'llama-3.2-90b', label: 'Llama 3.2 90B', disabled: true },
  { id: 'llama-3.1-405b', label: 'Llama 3.1 405B', disabled: true },
  { id: 'llama-3.1-70b', label: 'Llama 3.1 70B', disabled: true },
]

/** Fetch local models from Ollama (optional). Set OLLAMA_HOST to enable, e.g. http://localhost:11434 */
async function discoverLocalModels(): Promise<ModelItem[]> {
  const baseUrl = process.env.OLLAMA_HOST || 'http://localhost:11434'
  try {
    const res = await fetch(`${baseUrl.replace(/\/$/, '')}/api/tags`, { signal: AbortSignal.timeout(2000) })
    if (!res.ok) return []
    const data = (await res.json()) as { models?: { name: string }[] }
    const list = data?.models ?? []
    return list.map((m) => ({ id: m.name, label: m.name, baseUrl }))
  } catch {
    return []
  }
}

const router = new Hono()

router.get('/', async (c) => {
  const localModels = await discoverLocalModels()

  const providers: ModelProvider[] = [
    { id: 'anthropic', name: 'Anthropic', models: ANTHROPIC_MODELS },
    { id: 'openai', name: 'OpenAI', models: OPENAI_MODELS },
    { id: 'google', name: 'Google', models: GOOGLE_MODELS },
    { id: 'meta', name: 'Meta', models: META_MODELS },
    { id: 'local', name: 'Local (Ollama)', models: localModels },
  ]

  return c.json({ providers, defaultModelId: DEFAULT_MODEL_ID })
})

export default router
