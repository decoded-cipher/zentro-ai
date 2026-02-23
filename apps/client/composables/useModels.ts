export type { AIModel, ModelProvider } from '~/stores/models'

export function useModels() {
  const store = useModelsStore()

  onMounted(() => store.fetchModels())

  return {
    providers: storeToRefs(store).providers,
    defaultModelId: storeToRefs(store).defaultModelId,
    loading: storeToRefs(store).loading,
    error: storeToRefs(store).error,
    fetchModels: store.fetchModels,
    getModelLabel: store.getModelLabel,
    getProviderForModel: store.getProviderForModel,
  }
}
