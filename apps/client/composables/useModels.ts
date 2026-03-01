export function useModels() {
  const store = useModelsStore()

  return {
    providers: storeToRefs(store).providers,
    defaultModelId: storeToRefs(store).defaultModelId,
    loading: storeToRefs(store).loading,
    error: storeToRefs(store).error,
    apiKeys: storeToRefs(store).apiKeys,
    fetchModels: store.fetchModels,
    fetchApiKeys: store.fetchApiKeys,
    addApiKey: store.addApiKey,
    setKeyActive: store.setKeyActive,
    setKeyInactive: store.setKeyInactive,
    removeApiKey: store.removeApiKey,
    toggleModel: store.toggleModel,
    getModelLabel: store.getModelLabel,
    getProviderForModel: store.getProviderForModel,
  }
}
