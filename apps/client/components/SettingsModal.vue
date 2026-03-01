<template>
  <Teleport to="body">
    <Transition name="settings-modal">
      <div v-if="open" class="fixed inset-0 z-[200] flex items-center justify-center">
        <div class="absolute inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm" />

        <div class="relative w-full max-w-6xl h-[720px] mx-4 flex rounded-xl bg-white dark:bg-neutral-900 border border-border shadow-2xl overflow-hidden">
          <!-- Sidebar nav -->
          <nav class="w-52 flex-shrink-0 border-r border-border bg-muted/30 flex flex-col">
            <div class="p-4 h-14 border-b border-border">
              <h2 class="text-sm font-semibold text-foreground">Settings</h2>
            </div>
            <div class="flex-1 p-2 space-y-2">
              <button
                v-for="section in sections"
                :key="section.id"
                @click="activeSection = section.id"
                class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150"
                :class="[
                  activeSection === section.id
                    ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                    : 'text-foreground/70 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:text-foreground'
                ]"
              >
                <span class="w-5 h-5 flex-shrink-0 flex items-center justify-center" v-html="section.icon" />
                {{ section.label }}
              </button>
            </div>
          </nav>

          <!-- Content area -->
          <div class="flex-1 flex flex-col min-w-0">
            <div class="flex items-center justify-between px-6 h-14 border-b border-border flex-shrink-0">
              <h3 class="text-base font-semibold text-foreground">{{ activeLabel }}</h3>
              <button
                @click="close"
                class="p-1.5 -m-1.5 rounded-lg text-foreground/40 hover:text-foreground/70 hover:bg-muted transition-colors"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div class="flex-1 overflow-y-auto p-6 flex flex-col min-h-0">
              <div
                v-if="activeSection === 'models'"
                class="flex-1 flex flex-col min-h-0"
              >
                <SettingsModelsSection />
              </div>
              <template v-else>
                <SettingsArchivedChats v-if="activeSection === 'archived'" />
                <SettingsApiKeysSection v-else-if="activeSection === 'api-keys'" />
                <SettingsAccountSection v-else-if="activeSection === 'account'" />
                <SettingsAboutSection v-else-if="activeSection === 'about'" />
              </template>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ 'update:open': [value: boolean] }>()

const sections = [
  {
    id: 'archived',
    label: 'Archived Chats',
    icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7H4a1 1 0 01-1-1V4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-1 1z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 7v12a2 2 0 002 2h10a2 2 0 002-2V7" /></svg>',
  },
  {
    id: 'models',
    label: 'Models',
    icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>',
  },
  {
    id: 'api-keys',
    label: 'API Keys',
    icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>',
  },
  {
    id: 'account',
    label: 'Account',
    icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>',
  },
  {
    id: 'about',
    label: 'About',
    icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>',
  },
]

const activeSection = ref('archived')
const activeLabel = computed(() => sections.find(s => s.id === activeSection.value)?.label ?? '')

const close = () => emit('update:open', false)

const handleEscape = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.open) close()
}

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    document.addEventListener('keydown', handleEscape)
  } else {
    document.removeEventListener('keydown', handleEscape)
    activeSection.value = 'archived'
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscape)
})
</script>

<style>
.settings-modal-enter-active {
  transition: opacity 0.2s ease;
}
.settings-modal-enter-active > div:last-child {
  transition: opacity 0.2s ease, transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.settings-modal-leave-active {
  transition: opacity 0.15s ease;
}
.settings-modal-leave-active > div:last-child {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.settings-modal-enter-from {
  opacity: 0;
}
.settings-modal-enter-from > div:last-child {
  opacity: 0;
  transform: scale(0.95) translateY(8px);
}
.settings-modal-leave-to {
  opacity: 0;
}
.settings-modal-leave-to > div:last-child {
  opacity: 0;
  transform: scale(0.97);
}
</style>
