import { defineStore } from 'pinia'

const STORAGE_KEY = 'zentro-preferences'

export interface PreferencesState {
  lastSelectedProviderId: string | null
  lastSelectedModelId: string | null
}

function loadFromStorage(): PreferencesState {
  if (process.client) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<PreferencesState>
        return {
          lastSelectedProviderId: parsed.lastSelectedProviderId ?? null,
          lastSelectedModelId: parsed.lastSelectedModelId ?? null,
        }
      }
    } catch {
      // ignore
    }
  }
  return { lastSelectedProviderId: null, lastSelectedModelId: null }
}

function saveToStorage(state: PreferencesState) {
  if (process.client) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // ignore
    }
  }
}

export const usePreferencesStore = defineStore('preferences', () => {
  const stored = loadFromStorage()
  const lastSelectedProviderId = ref<string | null>(stored.lastSelectedProviderId)
  const lastSelectedModelId = ref<string | null>(stored.lastSelectedModelId)

  watch(
    [lastSelectedProviderId, lastSelectedModelId],
    ([provider, model]) => {
      saveToStorage({ lastSelectedProviderId: provider, lastSelectedModelId: model })
    },
    { immediate: true }
  )

  function setLastSelected(providerId: string | null, modelId: string | null) {
    lastSelectedProviderId.value = providerId
    lastSelectedModelId.value = modelId
  }

  function setLastSelectedModel(id: string | null) {
    lastSelectedModelId.value = id
  }

  return {
    lastSelectedProviderId,
    lastSelectedModelId,
    setLastSelected,
    setLastSelectedModel,
  }
})
