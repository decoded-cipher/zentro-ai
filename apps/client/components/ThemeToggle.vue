<template>
  <div class="relative theme-toggle-container">
    <button
      @click="isOpen = !isOpen"
      class="relative inline-flex h-9 w-9 items-center justify-center rounded border border-border bg-background text-foreground transition-all duration-200 hover:bg-muted hover:border-foreground/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      aria-label="Toggle theme"
    >
      <ClientOnly>
        <component :is="currentIcon" class="h-4 w-4 transition-transform duration-200" />
        <template #fallback>
          <component :is="DesktopIcon" class="h-4 w-4 transition-transform duration-200" />
        </template>
      </ClientOnly>
    </button>

    <div
      v-if="isOpen"
      class="absolute right-0 top-11 z-50 w-36 rounded-lg border border-border bg-card shadow-lg p-1 animate-in fade-in-0 zoom-in-95 duration-200"
    >
      <button
        v-for="themeOption in themes"
        :key="themeOption.value"
        @click="handleThemeChange(themeOption.value)"
        :class="[
          'w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150',
          theme === themeOption.value
            ? 'bg-muted text-foreground'
            : 'text-foreground/70 hover:bg-muted/50 hover:text-foreground',
        ]"
      >
        <component :is="themeOption.icon" class="h-4 w-4" />
        <span>{{ themeOption.label }}</span>
        <div
          v-if="theme === themeOption.value"
          class="ml-auto w-1.5 h-1.5 rounded-full bg-foreground"
        />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTheme } from '~/composables/useTheme'

const { theme, setTheme } = useTheme()
const isOpen = ref(false)

const SunIcon = () => h('svg', { class: 'h-4 w-4', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
  h('path', {
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    'stroke-width': '2',
    d: 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z',
  }),
])

const MoonIcon = () => h('svg', { class: 'h-4 w-4', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
  h('path', {
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    'stroke-width': '2',
    d: 'M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z',
  }),
])

const DesktopIcon = () => h('svg', { class: 'h-4 w-4', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
  h('path', {
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    'stroke-width': '2',
    d: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  }),
])

const themes = [
  { value: 'light' as const, label: 'Light', icon: SunIcon },
  { value: 'dark' as const, label: 'Dark', icon: MoonIcon },
  { value: 'system' as const, label: 'System', icon: DesktopIcon },
]

const currentTheme = computed(() => themes.find((t) => t.value === theme.value) ?? themes[2])
const currentIcon = computed(() => currentTheme.value.icon)

const handleThemeChange = (value: 'light' | 'dark' | 'system') => {
  setTheme(value)
  isOpen.value = false
}

onMounted(() => {
  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as HTMLElement
    if (!target.closest('.theme-toggle-container')) {
      isOpen.value = false
    }
  }

  watch(isOpen, (open) => {
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    } else {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  })
})
</script>

