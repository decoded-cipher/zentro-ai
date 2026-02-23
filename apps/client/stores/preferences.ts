import { defineStore } from 'pinia'

const STORAGE_KEY = 'zentro-preferences'

export interface PreferencesState {
  lastSelectedModelId: string | null
}

function loadFromStorage(): PreferencesState {
  if (process.client) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<PreferencesState>
        return {
          lastSelectedModelId: parsed.lastSelectedModelId ?? null,
        }
      }
    } catch {
      // ignore
    }
  }
  return { lastSelectedModelId: null }
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
  const lastSelectedModelId = ref<string | null>(loadFromStorage().lastSelectedModelId)

  watch(
    lastSelectedModelId,
    (val) => {
      saveToStorage({ lastSelectedModelId: val })
    },
    { immediate: true }
  )

  function setLastSelectedModel(id: string | null) {
    lastSelectedModelId.value = id
  }

  return {
    lastSelectedModelId,
    setLastSelectedModel,
  }
})
