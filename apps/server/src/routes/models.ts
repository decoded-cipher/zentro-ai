import { Hono } from 'hono'
import { eq, asc } from 'drizzle-orm'
import { db, apiKey, enabledModel, withDefaults } from '@repo/db'
import {
  PROVIDER_CATALOG,
  DEFAULT_MODEL_ID,
  AVAILABLE_PROVIDERS,
  getProviderCatalog,
} from '@repo/llm'
import { encryptApiKey, decryptApiKey } from '../lib/crypto'

export interface ModelItem {
  id: string
  label: string
  baseUrl?: string
  enabled: boolean
}

export interface ModelProvider {
  providerId: string
  name: string
  default: boolean
  availability: string
  models: ModelItem[]
}

/** Get enabled model IDs for provider. No preference row = use catalog default. */
async function getEnabledModelIds(provider: { providerId: string; models: { id: string; disabled?: boolean }[]; defaultModelIds: string[] }) {
  const prefs = await db.select({ modelId: enabledModel.modelId, enabled: enabledModel.enabled })
    .from(enabledModel).where(eq(enabledModel.providerId, provider.providerId))
  const prefMap = new Map(prefs.map((p) => [p.modelId, p.enabled === 1]))
  const enabled = new Set<string>()
  for (const m of provider.models) {
    const p = prefMap.get(m.id)
    const on = p !== undefined ? p === true : provider.defaultModelIds.includes(m.id)
    if (on && !(m.disabled ?? false)) enabled.add(m.id)
  }
  return enabled
}

/** Get provider availability: available, needs_key, blocked, or offline */
async function getProviderAvailability(provider: { providerId: string; default?: boolean }) {
  if (!AVAILABLE_PROVIDERS.has(provider.providerId)) {
    return 'blocked'
  }
  const rows = await db.select({ id: apiKey.id, active: apiKey.active }).from(apiKey).where(eq(apiKey.providerId, provider.providerId))
  const hasActiveKey = rows.some((r) => r.active === 1)
  if (provider.default && provider.providerId === 'anthropic') {
    return rows.length === 0 || hasActiveKey ? 'available' : 'needs_key'
  }
  return hasActiveKey ? 'available' : 'needs_key'
}

async function discoverLocalModels() {
  const baseUrl = process.env.OLLAMA_HOST || 'http://localhost:11434'
  try {
    const res = await fetch(`${baseUrl.replace(/\/$/, '')}/api/tags`, { signal: AbortSignal.timeout(2000) })
    if (!res.ok) return []
    const data = (await res.json()) as { models?: { name: string }[] }
    const list = data?.models ?? []
    return list.map((m) => ({ id: m.name, label: m.name, baseUrl, enabled: true }))
  } catch {
    return []
  }
}

const router = new Hono()

/** GET /models - List providers and models (single-user)
 * Query: enabled_only (default true) - when true, only return enabled models and omit providers with none */
router.get('/', async (c) => {
  const enabledOnly = c.req.query('enabled_only') !== 'false'
  const localModels = await discoverLocalModels()

  const providers: ModelProvider[] = []

  for (const catalog of PROVIDER_CATALOG) {
    const isLocal = catalog.providerId === 'local'
    const availability = isLocal
      ? (localModels.length > 0 ? 'available' : 'offline')
      : await getProviderAvailability(catalog)
    const canUse = availability === 'available'

    const enabledIds = await getEnabledModelIds(catalog)

    let models: ModelItem[] = isLocal
      ? localModels
      : catalog.models.map((m) => ({
          id: m.id,
          label: m.label,
          enabled: canUse && enabledIds.has(m.id) && !(m.disabled ?? false),
        }))

    if (enabledOnly) {
      models = models.filter((m) => m.enabled)
    }
    if (enabledOnly && models.length === 0 && !(isLocal && availability === 'offline')) continue

    providers.push({
      providerId: catalog.providerId,
      name: catalog.name,
      default: catalog.default,
      availability,
      models,
    })
  }

  return c.json({
    providers,
    defaultModelId: DEFAULT_MODEL_ID,
  })
})

/** POST /models/api-keys - Add API key (multiple keys per provider allowed) */
router.post('/api-keys', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const { providerId, apiKey: apiKeyValue, label } = body as { providerId?: string; apiKey?: string; label?: string }

  if (!providerId || !apiKeyValue || typeof apiKeyValue !== 'string') {
    return c.json({ error: 'providerId and apiKey are required' }, 400)
  }

  const provider = getProviderCatalog(providerId)
  if (!provider) return c.json({ error: `Unknown provider: ${providerId}` }, 400)
  if (!AVAILABLE_PROVIDERS.has(providerId)) return c.json({ error: 'Provider is not available yet' }, 400)
  if (provider.default && providerId !== 'anthropic') return c.json({ error: 'Cannot add API key for default provider' }, 400)

  const existing = await db.select().from(apiKey).where(eq(apiKey.providerId, providerId))
  const isFirst = existing.length === 0

  const values = {
    providerId,
    encryptedKey: encryptApiKey(apiKeyValue.trim()),
    label: typeof label === 'string' ? label.trim() || null : null,
    active: isFirst ? 1 : 0,
  }
  const [inserted] = await db.insert(apiKey).values(withDefaults(values)).returning()

  return c.json({ success: true, id: inserted.id })
})

function maskApiKey(key: string): string {
  if (!key || key.length < 10) return '••••••••'
  const head = 15
  const tail = 4
  if (key.length <= head + tail) return key.slice(0, 4) + '••••'
  return key.slice(0, head) + '...' + key.slice(-tail)
}

/** GET /models/api-keys - List all API keys */
router.get('/api-keys', async (c) => {
  const rows = await db.select({
    id: apiKey.id,
    providerId: apiKey.providerId,
    label: apiKey.label,
    active: apiKey.active,
    createdAt: apiKey.createdAt,
    encryptedKey: apiKey.encryptedKey,
  }).from(apiKey).orderBy(asc(apiKey.providerId), asc(apiKey.createdAt))

  const keys = rows.map((r) => {
    let keyPreview: string | null = null
    try {
      const decrypted = decryptApiKey(r.encryptedKey)
      keyPreview = maskApiKey(decrypted)
    } catch {
      keyPreview = '••••••••'
    }
    const { encryptedKey: _, ...rest } = r
    return { ...rest, keyPreview }
  })

  return c.json({ keys })
})

/** PATCH /models/api-keys/:id - Set key as active or inactive. Body: { active?: boolean } (default true) */
router.patch('/api-keys/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json().catch(() => ({}))
  const { active: setActive = true } = body as { active?: boolean }
  const [key] = await db.select().from(apiKey).where(eq(apiKey.id, id)).limit(1)
  if (!key) return c.json({ error: 'Key not found' }, 404)
  const now = Math.floor(Date.now() / 1000)
  if (setActive) {
    await db.update(apiKey).set({ active: 0, updatedAt: now }).where(eq(apiKey.providerId, key.providerId))
    await db.update(apiKey).set({ active: 1, updatedAt: now }).where(eq(apiKey.id, id))
  } else {
    await db.update(apiKey).set({ active: 0, updatedAt: now }).where(eq(apiKey.id, id))
  }
  return c.json({ success: true })
})

/** DELETE /models/api-keys/:id - Remove API key by id */
router.delete('/api-keys/:id', async (c) => {
  const id = c.req.param('id')
  const [key] = await db.select().from(apiKey).where(eq(apiKey.id, id)).limit(1)
  if (!key) return c.json({ error: 'Key not found' }, 404)
  await db.delete(apiKey).where(eq(apiKey.id, id))
  if (key.active) {
    const [next] = await db.select().from(apiKey).where(eq(apiKey.providerId, key.providerId)).limit(1)
    if (next) await db.update(apiKey).set({ active: 1, updatedAt: Math.floor(Date.now() / 1000) }).where(eq(apiKey.id, next.id))
  }
  return c.json({ success: true })
})

/** POST /models/toggle - Toggle model enabled state */
router.post('/toggle', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const { providerId, modelId, enabled } = body as { providerId?: string; modelId?: string; enabled?: boolean }
  if (!providerId || !modelId || typeof enabled !== 'boolean') {
    return c.json({ error: 'providerId, modelId, and enabled are required' }, 400)
  }
  const provider = getProviderCatalog(providerId)
  if (!provider) return c.json({ error: `Unknown provider: ${providerId}` }, 400)
  if (!provider.models.some((m) => m.id === modelId)) return c.json({ error: `Unknown model: ${modelId}` }, 400)

  const now = Math.floor(Date.now() / 1000)
  await db.insert(enabledModel).values(withDefaults({ providerId, modelId, enabled: enabled ? 1 : 0 }))
    .onConflictDoUpdate({
      target: [enabledModel.providerId, enabledModel.modelId],
      set: { enabled: enabled ? 1 : 0, updatedAt: now },
    })
  return c.json({ success: true })
})

export default router
