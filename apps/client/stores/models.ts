import { defineStore } from 'pinia'

export interface AIModel {
  id: string
  label: string
  baseUrl?: string
  disabled?: boolean
}

export interface ModelProvider {
  providerId: string
  name: string
  models: AIModel[]
}

export const useModelsStore = defineStore('models', () => {
  const { apiClient, API_ENDPOINTS } = useApi()

  const providers = ref<ModelProvider[]>([])
  const defaultModelId = ref<string | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const _fetched = ref(false)
  let _fetchPromise: Promise<void> | null = null

  async function fetchModels() {
    if (_fetched.value) return

    if (_fetchPromise) {
      await _fetchPromise
      return
    }

    loading.value = true
    error.value = null

    _fetchPromise = (async () => {
      try {
        const { data } = await apiClient.get<{
          providers?: ModelProvider[]
          defaultModelId?: string
        }>(API_ENDPOINTS.models)

        providers.value = data?.providers ?? []
        defaultModelId.value = data?.defaultModelId ?? null
        _fetched.value = true
      } catch (e: unknown) {
        error.value = e instanceof Error ? e.message : 'Failed to load models'
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
    _fetched.value = false
    _fetchPromise = null
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
  }
})
