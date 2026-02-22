<template>
  <div>
    <p class="text-sm text-foreground/60 mb-4">Available AI models across all providers. Model selection is done per-chat from the chat interface.</p>

    <div v-if="loading" class="space-y-3">
      <div v-for="i in 3" :key="i" class="animate-pulse">
        <div class="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-20 mb-2" />
        <div class="space-y-1.5">
          <div class="h-8 bg-neutral-200 dark:bg-neutral-700 rounded" />
          <div class="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-4/5" />
        </div>
      </div>
    </div>

    <div v-else class="space-y-5">
      <div v-for="provider in providers" :key="provider.id">
        <div class="flex items-center gap-2 mb-2">
          <ProviderIcon :provider-id="provider.id" size="sm" />
          <h4 class="text-xs font-semibold text-foreground/50 uppercase tracking-wider">{{ provider.name }}</h4>
          <span class="text-[10px] text-foreground/30 font-medium">{{ provider.models.length }} model{{ provider.models.length !== 1 ? 's' : '' }}</span>
        </div>
        <div v-if="provider.models.length > 0" class="space-y-0.5">
          <div
            v-for="model in provider.models"
            :key="model.id"
            class="flex items-center gap-3 px-3 py-2 rounded-lg"
            :class="model.disabled ? 'opacity-50' : 'hover:bg-muted/40'"
          >
            <span class="text-sm text-foreground">{{ model.label }}</span>
            <span v-if="model.id === defaultModelId" class="px-1.5 py-0.5 rounded text-[10px] font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">Default</span>
            <span v-if="model.disabled" class="px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-foreground/40">Coming soon</span>
            <span class="flex-1" />
            <span class="text-[11px] text-foreground/30 font-mono">{{ model.id }}</span>
          </div>
        </div>
        <p v-else class="px-3 py-2 text-xs text-foreground/40">
          {{ provider.id === 'local' ? 'No local models detected. Make sure Ollama is running.' : 'No models available.' }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { providers, loading, defaultModelId, fetchModels } = useModels()

onMounted(() => fetchModels())
</script>
