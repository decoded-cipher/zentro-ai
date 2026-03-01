import { defineStore } from 'pinia'

export interface AIModel {
  id: string
  label: string
  baseUrl?: string
  enabled?: boolean
}

export type ProviderAvailability = 'available' | 'blocked' | 'needs_key' | 'offline'

export interface ModelProvider {
  providerId: string
  name: string
  default?: boolean
  availability?: ProviderAvailability
  models: AIModel[]
}

export interface ApiKeyRecord {
  id: string
  providerId: string
  label: string | null
  active: number
  createdAt: number
  keyPreview?: string | null
}

export const useModelsStore = defineStore('models', () => {
  const { apiClient, API_ENDPOINTS } = useApi()

  const providers = ref<ModelProvider[]>([])
  const defaultModelId = ref<string | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  // Cache: true = fetched for picker (enabled only), false = fetched for settings (full). null = stale.
  const _fetched = ref(null)
  let _fetchPromise = null

  async function fetchModels(enabledOnly = true) {
    if (_fetched.value === enabledOnly) return
    if (_fetchPromise) {
      await _fetchPromise
      if (_fetched.value === enabledOnly) return
    }

    loading.value = true
    error.value = null
    _fetchPromise = (async () => {
      try {
        const url = `${API_ENDPOINTS.models.list}${enabledOnly ? '' : '?enabled_only=false'}`
        const { data } = await apiClient.get(url)
        providers.value = data?.providers ?? []
        defaultModelId.value = data?.defaultModelId ?? null
        _fetched.value = enabledOnly
      } catch (e) {
        error.value = (e && e.message) || 'Failed to load models'
        providers.value = []
      } finally {
        loading.value = false
        _fetchPromise = null
      }
    })()
    await _fetchPromise
  }

  function find(id: string) {
    const effectiveId = id || defaultModelId.value || ''
    if (!effectiveId) return null
    for (const p of providers.value) {
      const m = p.models.find((x) => x.id === effectiveId)
      if (m) return { model: m, provider: p }
    }
    return null
  }

  function getModelLabel(id: string) {
    const found = find(id)
    return found ? found.model.label : (id || defaultModelId.value || '')
  }

  function getProviderForModel(id: string) {
    return find(id)?.provider.providerId ?? ''
  }

  function invalidate() {
    _fetched.value = null
    _fetchPromise = null
  }

  const apiKeys = ref<ApiKeyRecord[]>([])

  async function fetchApiKeys() {
    try {
      const { data } = await apiClient.get(API_ENDPOINTS.models.apiKeys)
      apiKeys.value = data?.keys ?? []
    } catch {
      apiKeys.value = []
    }
  }

  async function addApiKey(providerId: string, apiKey: string, label?: string) {
    await apiClient.post(API_ENDPOINTS.models.addApiKey, { providerId, apiKey, label })
    invalidate()
    await fetchApiKeys()
    await fetchModels(false)
  }

  async function setKeyActive(id: string) {
    await apiClient.patch(API_ENDPOINTS.models.setKeyDefault(id), { active: true })
    invalidate()
    await fetchApiKeys()
    await fetchModels(false)
  }

  async function setKeyInactive(id: string) {
    await apiClient.patch(API_ENDPOINTS.models.setKeyDefault(id), { active: false })
    invalidate()
    await fetchApiKeys()
    await fetchModels(false)
  }

  async function removeApiKey(id: string) {
    await apiClient.delete(API_ENDPOINTS.models.removeApiKey(id))
    invalidate()
    await fetchApiKeys()
    await fetchModels(false)
  }

  async function toggleModel(providerId: string, modelId: string, enabled: boolean) {
    await apiClient.post(API_ENDPOINTS.models.toggle, { providerId, modelId, enabled })
    invalidate()
    await fetchModels(false)
  }

  return {
    providers,
    defaultModelId,
    loading,
    error,
    fetchModels,
    getModelLabel,
    getProviderForModel,
    find,
    invalidate,
    apiKeys,
    fetchApiKeys,
    addApiKey,
    setKeyActive,
    setKeyInactive,
    removeApiKey,
    toggleModel,
  }
})
