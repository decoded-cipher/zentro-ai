<template>
  <div class="models-page flex flex-col min-h-0 flex-1">
    <p class="text-sm text-muted-foreground mb-4 flex-shrink-0">
      Enable or disable models for the chat picker. Add API keys for providers that need them.
    </p>

    <!-- Search -->
    <div class="relative mb-4 flex-shrink-0">
      <svg
        class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search models..."
        class="w-full pl-10 pr-10 py-2.5 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500/50 transition"
      />
      <button
        v-if="searchQuery"
        type="button"
        class="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition"
        @click="searchQuery = ''"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Two-pane layout - fills available space -->
    <div class="flex flex-1 min-h-0 rounded-xl border border-border overflow-hidden bg-card">
      <!-- Provider list (left) - content height, no stretch -->
      <div class="w-[220px] flex-shrink-0 self-start border-r border-border max-h-full overflow-y-auto">
        <div v-if="loading" class="p-3 space-y-2">
          <div v-for="i in 6" :key="i" class="h-10 rounded-lg bg-muted animate-pulse" />
        </div>
        <div v-else class="p-2 flex flex-col gap-1">
          <button
            v-for="provider in filteredProviders"
            :key="provider.providerId"
            type="button"
            class="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left text-sm font-medium transition-colors"
            :class="[
              expandedProvider === provider.providerId
                ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                : 'text-foreground/80 hover:bg-muted'
            ]"
            @click="toggleProvider(provider.providerId)"
          >
            <ProviderIcon :provider-id="provider.providerId" size="sm" />
            <span class="truncate flex-1">{{ provider.name }}</span>
            <span
              v-if="provider.availability === 'available'"
              class="w-2 h-2 rounded-full bg-emerald-500 shrink-0"
            ></span>
            <span
              v-else-if="provider.availability === 'needs_key'"
              class="w-2 h-2 rounded-full bg-yellow-500 shrink-0"
            ></span>
            <span
              v-else-if="provider.availability === 'blocked'"
              class="w-3 h-3 text-muted-foreground/60 shrink-0"
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </span>
            <span
              v-else-if="provider.availability === 'offline'"
              class="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500 shrink-0"
            ></span>
          </button>
        </div>
      </div>

      <!-- Models (right) -->
      <div class="flex-1 flex flex-col min-w-0">
        <div v-if="loading" class="p-4 space-y-3">
          <div v-for="j in 5" :key="j" class="h-12 rounded-lg bg-muted/50 animate-pulse" />
        </div>

        <template v-else-if="selectedProvider">
          <div class="px-4 py-3 border-b border-border bg-muted/20 flex items-center justify-between gap-2">
            <div>
              <h3 class="text-sm font-semibold text-foreground">{{ selectedProvider.name }}</h3>
              <p class="text-xs text-muted-foreground mt-0.5">
                {{ getFilteredModels(selectedProvider).length }} models
                <template v-if="selectedProvider.availability === 'available'">
                  · {{ enabledCount(selectedProvider) }} enabled
                </template>
              </p>
            </div>
            <!-- Online -->
            <span
              v-if="selectedProvider.availability === 'available'"
              class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-800/50 shrink-0"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z" />
              </svg>
              Online
            </span>
            <!-- Coming soon -->
            <span
              v-else-if="selectedProvider.availability === 'blocked'"
              class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/70 dark:border-amber-800/50 shrink-0"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Coming soon
            </span>
            <!-- API Key missing -->
            <span
              v-else-if="selectedProvider.availability === 'needs_key'"
              class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-50 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-400 border border-yellow-200/70 dark:border-yellow-800/50 shrink-0"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              API key required
            </span>
            <!-- Local -->
            <span
              v-else-if="selectedProvider.providerId === 'local' && selectedProvider.availability === 'offline'"
              class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200/70 dark:border-blue-800/50 shrink-0"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Local (offline)
            </span>
            <!-- Offline -->
            <span
              v-else-if="selectedProvider.availability === 'offline'"
              class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border border-slate-200/70 dark:border-slate-700/50 shrink-0"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
              </svg>
              Offline
            </span>
          </div>

          <div class="flex-1 min-h-0 overflow-y-auto p-3 flex flex-col">
            <div
              v-if="getFilteredModels(selectedProvider).length > 0"
              class="space-y-1 flex-shrink-0"
            >
              <button
                v-for="model in getFilteredModels(selectedProvider)"
                :key="model.id"
                type="button"
                class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors"
                :class="[
                  selectedProvider.availability !== 'available' ? 'opacity-70 cursor-default' : 'hover:bg-muted/60 cursor-pointer',
                  model.enabled && selectedProvider.availability === 'available' && 'bg-orange-50 dark:bg-orange-900/20'
                ]"
                :disabled="selectedProvider.availability !== 'available'"
                @click="selectedProvider.availability === 'available' && toggleModel(selectedProvider, model)"
              >
                <span
                  class="relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors items-center p-0.5"
                  :class="[
                    model.enabled ? 'bg-orange-500' : 'bg-muted',
                    selectedProvider.availability !== 'available' && 'opacity-60'
                  ]"
                >
                  <span
                    class="block h-4 w-4 rounded-full bg-white shadow transition-transform"
                    :class="model.enabled ? 'translate-x-4' : 'translate-x-0'"
                  />
                </span>
                <div class="flex-1 min-w-0">
                  <span class="text-sm font-medium text-foreground block truncate">{{ model.label }}</span>
                  <span class="text-xs text-muted-foreground font-mono truncate block">{{ model.id }}</span>
                </div>
                <span
                  v-if="model.id === defaultModelId"
                  class="px-2 py-0.5 rounded text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 shrink-0"
                >
                  Default
                </span>
              </button>
            </div>
            <div
              v-else
              class="flex-1 flex flex-col items-center justify-center text-center px-4 min-h-[200px]"
            >
              <template v-if="selectedProvider.providerId === 'local' && selectedProvider.availability === 'offline'">
                <p class="text-base font-medium text-foreground">No local models detected</p>
                <p class="text-sm text-muted-foreground mt-1.5">Make sure Ollama is running</p>
                <p class="text-xs text-muted-foreground/80 mt-4">
                  Install Ollama, start the server, then refresh to see your local models.
                </p>
              </template>
              <template v-else>
                <p class="text-sm text-muted-foreground">
                  {{ searchQuery ? 'No models match your search.' : 'No models available.' }}
                </p>
              </template>
            </div>
          </div>
        </template>

        <div v-else class="flex-1 flex items-center justify-center text-sm text-muted-foreground">
          Select a provider
        </div>
      </div>
    </div>

    <div
      v-if="!loading && filteredProviders.length === 0"
      class="mt-4 py-8 text-center text-sm text-muted-foreground rounded-xl border border-dashed border-border"
    >
      No providers match your search.
    </div>
  </div>
</template>

<script setup>
const { providers, loading, defaultModelId, fetchModels, toggleModel: toggleModelStore } = useModels()

const searchQuery = ref('')
const expandedProvider = ref(null)

const filteredProviders = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return providers.value
  return providers.value
    .map((p) => {
      const matches = p.models.filter((m) =>
        m.label.toLowerCase().includes(q) || m.id.toLowerCase().includes(q)
      )
      return matches.length > 0 ? { ...p, models: matches } : null
    })
    .filter(Boolean)
})

const selectedProvider = computed(() => {
  if (!expandedProvider.value) return null
  return filteredProviders.value.find((p) => p.providerId === expandedProvider.value) ?? null
})

function getFilteredModels(provider) {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return provider.models
  return provider.models.filter((m) =>
    m.label.toLowerCase().includes(q) || m.id.toLowerCase().includes(q)
  )
}

function enabledCount(provider) {
  return provider.models.filter((m) => m.enabled).length
}

function toggleProvider(providerId) {
  expandedProvider.value = expandedProvider.value === providerId ? null : providerId
}

onMounted(async () => {
  await fetchModels(false)
  if (providers.value.length > 0 && !expandedProvider.value) {
    expandedProvider.value = providers.value[0].providerId
  }
})

watch(
  filteredProviders,
  (next) => {
    if (next.length > 0 && (!expandedProvider.value || !next.some((p) => p.providerId === expandedProvider.value))) {
      expandedProvider.value = next[0].providerId
    }
  },
  { immediate: true }
)

function toggleModel(provider, model) {
  toggleModelStore(provider.providerId, model.id, !model.enabled).catch(console.error)
}
</script>
