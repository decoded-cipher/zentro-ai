<template>
  <div class="relative" ref="rootRef">
    <button
      type="button"
      :disabled="disabled || loading"
      :class="[
        'inline-flex items-center border border-neutral-200 dark:border-neutral-700',
        compact ? 'rounded-sm' : 'rounded-lg',
        'hover:bg-muted hover:border-orange-300/50 dark:hover:border-orange-700/50',
        'focus:outline-none focus:ring-0',
        'transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none max-w-[200px]',
        compact ? 'gap-1.5 px-2 py-[4px] text-[9px]' : 'gap-3 px-2.5 py-1.5 text-xs',
      ]"
      @click="open = !open"
    >
      <ProviderIcon :provider-id="currentProviderId" :class="compact ? 'h-3 w-3' : ''" size="xs" />
      <span class="truncate text-foreground">{{ displayLabel }}</span>
      <svg class="shrink-0 text-muted-foreground transition-transform" :class="[compact ? 'w-2.5 h-2.5' : 'w-3 h-3', open && 'rotate-180']" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-150 ease-out"
        enter-from-class="opacity-0 scale-95"
        enter-to-class="opacity-100 scale-100"
        leave-active-class="transition duration-100 ease-in"
        leave-from-class="opacity-100 scale-100"
        leave-to-class="opacity-0 scale-95"
      >
        <div
          v-if="open"
          ref="panelRef"
          class="fixed z-[100] w-[min(260px,calc(100vw-20px))] overflow-hidden rounded-xl border border-border bg-popover shadow-lg backdrop-blur-sm"
          :style="panelStyle"
        >
          <div class="p-1.5 border-b border-border">
            <input
              ref="searchRef"
              v-model="searchQuery"
              type="text"
              placeholder="Search..."
              class="w-full rounded-md border border-input bg-muted/50 px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring/20 outline-none"
            />
          </div>
          <div class="max-h-[220px] overflow-y-auto p-1 custom-scrollbar">
            <template v-if="loading">
              <div class="flex items-center justify-center gap-1.5 py-6">
                <div class="h-3.5 w-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span class="text-xs text-muted-foreground">Loading...</span>
              </div>
            </template>
            <template v-else>
              <div v-for="provider in filteredProviders" :key="provider.id" class="py-0.5 first:pt-0">
                <div class="px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {{ provider.name }}
                </div>
                <template v-if="provider.models.length">
                  <button
                    v-for="m in provider.models"
                    :key="m.id"
                    type="button"
                    class="w-full flex items-center gap-2 px-2 py-1.5 text-left rounded-md transition-colors text-xs"
                    :class="[
                      m.disabled
                        ? 'cursor-not-allowed opacity-50 text-muted-foreground'
                        : model === m.id
                          ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 font-medium'
                          : 'text-foreground hover:bg-muted',
                    ]"
                    :disabled="m.disabled"
                    @click="!m.disabled && select(m.id)"
                  >
                    <ProviderIcon :provider-id="provider.id" size="xs" />
                    <span v-if="!m.disabled && model === m.id" class="text-orange-500 text-[10px]">✓</span>
                    <span v-else class="w-3" />
                    <span class="truncate flex-1 min-w-0">{{ m.label }}</span>
                    <span v-if="m.disabled" class="text-[9px] text-muted-foreground shrink-0">Coming soon</span>
                  </button>
                </template>
                <div v-else class="px-2 py-1.5 text-[10px] text-muted-foreground">
                  {{ provider.id === 'local' ? 'No local models.' : 'None.' }}
                </div>
              </div>
            </template>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    model: string
    disabled?: boolean
    compact?: boolean
  }>(),
  { disabled: false, compact: false }
)

const emit = defineEmits<{
  'update:model': [value: string]
}>()

const { providers, loading, defaultModelId, getModelLabel, getProviderForModel, fetchModels } = useModels()

const open = ref(false)
const searchQuery = ref('')
const rootRef = ref<HTMLElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)
const searchRef = ref<HTMLInputElement | null>(null)

const displayLabel = computed(() => getModelLabel(props.model || defaultModelId.value || ''))

const currentProviderId = computed(() => getProviderForModel(props.model || defaultModelId.value || ''))

const filteredProviders = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return providers.value
  return providers.value
    .map((p) => ({
      ...p,
      models: p.models.filter((m) => m.label.toLowerCase().includes(q)),
    }))
    .filter((p) => p.models.length > 0 || p.id === 'local')
})

const panelStyle = computed(() => {
  if (!rootRef.value || typeof document === 'undefined') return {}
  const rect = rootRef.value.getBoundingClientRect()
  const padding = 8
  const panelHeight = 240
  const spaceBelow = window.innerHeight - rect.bottom
  const openDown = spaceBelow >= panelHeight || spaceBelow >= rect.top
  return {
    left: `${Math.max(padding, Math.min(rect.left, window.innerWidth - 260 - padding))}px`,
    ...(openDown
      ? { top: `${rect.bottom + 4}px` }
      : { bottom: `${window.innerHeight - rect.top + 4}px`, top: 'auto' }),
  }
})

function select(id: string) {
  emit('update:model', id)
  open.value = false
  searchQuery.value = ''
}

function onClickOutside(e: MouseEvent) {
  const target = e.target as Node
  if (open.value && panelRef.value && !panelRef.value.contains(target) && rootRef.value && !rootRef.value.contains(target)) {
    open.value = false
  }
}

watch(open, (isOpen) => {
  if (isOpen) {
    fetchModels()
    nextTick(() => searchRef.value?.focus())
    document.addEventListener('click', onClickOutside)
  } else {
    document.removeEventListener('click', onClickOutside)
  }
})

onUnmounted(() => {
  document.removeEventListener('click', onClickOutside)
})
</script>
