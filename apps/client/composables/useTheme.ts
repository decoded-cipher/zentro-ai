import { useColorMode } from '@vueuse/core'

export const useTheme = () => {
  const colorMode = useColorMode({
    selector: 'html',
    attribute: 'class',
    modes: {
      light: '',
      dark: 'dark',
    },
  })

  const currentTheme = ref<'light' | 'dark' | 'system'>('system')

  const setTheme = (theme: 'light' | 'dark' | 'system') => {
    currentTheme.value = theme
    if (theme === 'system') {
      if (process.client) {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        colorMode.value = prefersDark ? 'dark' : 'light'
      }
    } else {
      colorMode.value = theme
    }
  }

  const theme = computed(() => {
    if (currentTheme.value === 'system') {
      return colorMode.value
    }
    return currentTheme.value
  })

  // Initialize system theme detection
  if (process.client) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const updateSystemTheme = () => {
      if (currentTheme.value === 'system') {
        colorMode.value = mediaQuery.matches ? 'dark' : 'light'
      }
    }
    updateSystemTheme()
    mediaQuery.addEventListener('change', updateSystemTheme)
  }

  return {
    theme,
    setTheme,
  }
}

