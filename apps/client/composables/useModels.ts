export interface AIModel {
  id: string
  label: string
  baseUrl?: string
  disabled?: boolean
}

export interface ModelProvider {
  id: string
  name: string
  models: AIModel[]
}

let cache: { providers: ModelProvider[]; defaultModelId: string | null } | null = null

export function useModels() {
  const { apiClient, API_ENDPOINTS } = useApi()
  const providers = ref<ModelProvider[]>(cache?.providers ?? [])
  const defaultModelId = ref<string | null>(cache?.defaultModelId ?? null)
  const loading = ref(!cache)
  const error = ref<string | null>(null)

  async function fetchModels() {
    if (cache) {
      providers.value = cache.providers
      defaultModelId.value = cache.defaultModelId
      return
    }
    loading.value = true
    error.value = null
    try {
      const { data } = await apiClient.get<{ providers?: ModelProvider[]; defaultModelId?: string }>(API_ENDPOINTS.models)
      const list = data?.providers ?? []
      const defaultId = data?.defaultModelId ?? null
      cache = { providers: list, defaultModelId: defaultId }
      providers.value = list
      defaultModelId.value = defaultId
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Failed to load models'
      providers.value = []
    } finally {
      loading.value = false
    }
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
    return find(id)?.provider.id ?? ''
  }

  onMounted(fetchModels)

  return {
    providers,
    defaultModelId,
    loading,
    error,
    fetchModels,
    getModelLabel,
    getProviderForModel,
  }
}
