<template>
  <div class="api-keys-page w-full">
    <!-- Header -->
    <div class="mb-6">
      <p class="text-sm text-muted-foreground leading-relaxed">
        Connect your LLM provider accounts. Keys are encrypted and never leave your device.
      </p>
    </div>

    <!-- Add key flow -->
    <div class="rounded-xl border border-border bg-card/50 overflow-hidden mb-6">
      <div class="px-4 py-3 border-b border-border bg-muted/20">
        <h4 class="text-sm font-semibold text-foreground">Add API Key</h4>
      </div>

      <!-- Step 1: Provider selection -->
      <div v-if="!addForm.providerId" class="p-4">
        <p class="text-xs text-muted-foreground mb-3">Choose a provider to add a key for:</p>
        <div class="grid grid-cols-3 sm:grid-cols-6 gap-3">
          <button
            v-for="p in keyableProviders"
            :key="p.providerId"
            type="button"
            :disabled="p.availability === 'blocked'"
            class="flex flex-col items-center justify-center gap-3 p-4 rounded-xl border border-border transition-all duration-200 group"
            :class="p.availability === 'blocked'
              ? 'bg-muted/20 opacity-60 cursor-not-allowed'
              : 'bg-muted/30 hover:bg-muted/60 hover:border-orange-500/30 hover:shadow-sm'"
            @click="p.availability !== 'blocked' && (addForm.providerId = p.providerId)"
          >
            <ProviderIcon :provider-id="p.providerId" size="md" :class="p.availability === 'blocked' ? 'opacity-60' : 'opacity-85 group-hover:opacity-100'" />
            <span class="text-xs font-medium truncate w-full text-center leading-tight" :class="p.availability === 'blocked' ? 'text-muted-foreground' : 'text-foreground'">{{ p.name }}</span>
          </button>
        </div>
      </div>

      <!-- Step 2: Key input form -->
      <div v-else class="p-4 space-y-4">
        <div class="flex items-center gap-3 pb-2 border-b border-border/60">
          <button
            type="button"
            class="p-1 -ml-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            aria-label="Back to provider selection"
            @click="addForm = { providerId: '', apiKey: '', label: '' }"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <ProviderIcon :provider-id="addForm.providerId" size="sm" />
          <span class="text-sm font-medium">{{ getProviderName(addForm.providerId) }}</span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-[1fr_200px] gap-4">
          <div>
            <label class="block text-xs font-medium text-muted-foreground mb-1.5">API Key</label>
            <div class="relative">
              <input
                v-model="addForm.apiKey"
                type="password"
                placeholder="sk-... or paste your key"
                autocomplete="off"
                class="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500/50 transition-shadow"
                @keydown.enter="submitAddKey"
              />
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-muted-foreground mb-1.5">Label <span class="font-normal text-muted-foreground/70">(optional)</span></label>
            <input
              v-model="addForm.label"
              type="text"
              placeholder="e.g. Work, Personal"
              class="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500/50 transition-shadow"
              @keydown.enter="submitAddKey"
            />
          </div>
        </div>

        <div class="flex gap-2 pt-1">
          <button
            type="button"
            class="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
            :disabled="!addForm.apiKey.trim() || addLoading"
            @click="submitAddKey"
          >
            {{ addLoading ? 'Adding...' : 'Add key' }}
          </button>
          <button
            type="button"
            class="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            @click="addForm = { providerId: '', apiKey: '', label: '' }"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>

    <!-- Your keys -->
    <div>
      <h4 class="text-sm font-semibold text-foreground mb-3">Your API Keys</h4>

      <div
        v-if="apiKeys.length === 0"
        class="rounded-lg border border-dashed border-border py-8 px-5 text-center"
      >
        <div class="inline-flex w-10 h-10 items-center justify-center rounded-lg bg-muted/60 mb-3">
          <svg class="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
          </svg>
        </div>
        <p class="text-sm font-medium text-foreground mb-1.5">No API keys yet</p>
        <p class="text-xs text-muted-foreground">Add one above and get started</p>
      </div>

      <div v-else class="w-full space-y-2">
        <div
          v-for="key in apiKeys"
          :key="key.id"
          class="w-full flex items-center gap-4 px-4 py-3 rounded-lg border border-border bg-card hover:bg-muted/20 transition-colors"
        >
          <div class="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
            <ProviderIcon :provider-id="key.providerId" size="sm" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-sm font-medium text-foreground">{{ getProviderName(key.providerId) }}</span>
              <span v-if="key.label" class="text-xs text-muted-foreground">— {{ key.label }}</span>
            </div>
            <p class="text-[10px] text-muted-foreground mt-0.5">Added on {{ formatDate(key.createdAt) }}</p>
          </div>
          <div class="flex justify-end min-w-0 w-[175px] shrink-0">
            <p v-if="key.keyPreview" class="text-xs font-mono text-muted-foreground tabular-nums truncate">
              {{ key.keyPreview }}
            </p>
          </div>
          <div class="flex items-center justify-end gap-2 w-[60px] shrink-0">
            <span
              v-if="key.active"
              class="px-2 py-1 rounded-md text-[11px] font-medium bg-orange-500/15 text-orange-600 dark:text-orange-400"
            >
              Active
            </span>
          </div>
          <div class="shrink-0">
            <div class="relative" data-key-menu>
              <button
                type="button"
                class="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                title="More options"
                @click.stop="openMenuKeyId = openMenuKeyId === key.id ? null : key.id"
              >
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                </svg>
              </button>
              <div
                v-if="openMenuKeyId === key.id"
                class="absolute right-0 top-full mt-1 py-1 w-[180px] rounded-lg border border-border bg-popover shadow-lg z-10"
              >
                <button
                  v-if="key.active"
                  type="button"
                  class="w-full px-3 py-2 text-left text-sm text-foreground hover:bg-muted flex items-center gap-2"
                  @click="setKeyInactive(key.id).then(() => openMenuKeyId = null).catch(console.error)"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Set as inactive
                </button>
                <button
                  v-else
                  type="button"
                  class="w-full px-3 py-2 text-left text-sm text-foreground hover:bg-muted flex items-center gap-2"
                  @click="setKeyActive(key.id).then(() => openMenuKeyId = null).catch(console.error)"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Set as active
                </button>
                <button
                  type="button"
                  class="w-full px-3 py-2 text-left text-sm text-destructive hover:bg-destructive/10 flex items-center gap-2"
                  @click="openMenuKeyId = null; confirmRemove(key)"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Remove confirmation modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="removeTarget"
          class="fixed inset-0 z-[300] flex items-center justify-center p-4"
          @click.self="removeTarget = null"
        >
          <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            class="relative w-full max-w-sm rounded-xl border border-border bg-popover p-5 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="remove-title"
          >
            <h3 id="remove-title" class="text-base font-semibold text-foreground mb-1">Remove API key?</h3>
            <p class="text-sm text-muted-foreground mb-5">
              You'll need to add it again to use {{ getProviderName(removeTarget.providerId) }} models.
            </p>
            <div class="flex justify-end gap-2">
              <button
                type="button"
                class="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
                @click="removeTarget = null"
              >
                Cancel
              </button>
              <button
                type="button"
                class="px-4 py-2 rounded-lg text-sm font-medium bg-destructive text-destructive-foreground hover:opacity-90 transition-opacity"
                @click="submitRemove"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
const { providers, apiKeys, fetchApiKeys, addApiKey, setKeyActive, setKeyInactive, removeApiKey, fetchModels } = useModels()

const keyableProviders = computed(() => providers.value.filter((p) => p.providerId !== 'local'))

const addForm = ref({ providerId: '', apiKey: '', label: '' })
const addLoading = ref(false)
const removeTarget = ref(null)
const openMenuKeyId = ref(null)

function closeMenuOnClickOutside(e) {
  if (openMenuKeyId.value && !e.target?.closest('[data-key-menu]')) {
    openMenuKeyId.value = null
  }
}

onMounted(async () => {
  document.addEventListener('click', closeMenuOnClickOutside)
  await fetchModels(false)
  await fetchApiKeys()
})

onUnmounted(() => {
  document.removeEventListener('click', closeMenuOnClickOutside)
})

function getProviderName(providerId) {
  return keyableProviders.value.find((p) => p.providerId === providerId)?.name ?? providerId
}

function formatDate(ts) {
  return new Date(ts * 1000).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

async function submitAddKey() {
  if (!addForm.value.providerId || !addForm.value.apiKey.trim()) return
  addLoading.value = true
  try {
    await addApiKey(addForm.value.providerId, addForm.value.apiKey.trim(), addForm.value.label.trim() || undefined)
    addForm.value = { providerId: '', apiKey: '', label: '' }
  } catch (e) {
    console.error('Failed to add API key:', e)
  } finally {
    addLoading.value = false
  }
}

function confirmRemove(key) {
  removeTarget.value = key
}

async function submitRemove() {
  if (!removeTarget.value) return
  try {
    await removeApiKey(removeTarget.value.id)
    removeTarget.value = null
  } catch (e) {
    console.error('Failed to remove key:', e)
  }
}
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-active > div:last-child,
.modal-leave-active > div:last-child {
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from > div:last-child,
.modal-leave-to > div:last-child {
  transform: scale(0.95);
}
</style>
