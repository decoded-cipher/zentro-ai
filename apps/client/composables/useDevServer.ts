export const useDevServer = (previewUrl: ComputedRef<string>, isProjectReady: ComputedRef<boolean>) => {
  const isChecking = ref(false)
  const isAvailable = ref(false)

  const checkAvailability = async (url: string): Promise<boolean> => {
    if (!url) return false

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3000)

      await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-cache',
      })

      clearTimeout(timeoutId)
      return true
    } catch (err: any) {
      // Network errors indicate server is not reachable
      const isNetworkError = err.name === 'AbortError' ||
        err.message?.includes('Failed to fetch') ||
        err.message?.includes('NetworkError')
      return !isNetworkError
    }
  }

  const check = async () => {
    if (!previewUrl.value) {
      isAvailable.value = false
      return false
    }

    isChecking.value = true
    try {
      isAvailable.value = await checkAvailability(previewUrl.value)
    } finally {
      isChecking.value = false
    }
    return isAvailable.value
  }

  // Reset availability when preview URL changes
  watch(previewUrl, () => {
    isAvailable.value = false
  })

  const previewSrc = computed(() => {
    return isAvailable.value && previewUrl.value ? previewUrl.value : ''
  })

  const showOverlay = computed(() => {
    return !isProjectReady.value || !previewUrl.value || isChecking.value || !isAvailable.value
  })

  const description = computed(() => {
    if (!isProjectReady.value) return 'Waiting for project to be ready...'
    if (!previewUrl.value) return 'Dev server not configured'
    if (isChecking.value) return 'Checking dev server...'
    if (!isAvailable.value) return 'Dev server not running. Start your dev server in the terminal.'
    return 'Your application preview'
  })

  return {
    isChecking: readonly(isChecking),
    isAvailable: readonly(isAvailable),
    previewSrc,
    showOverlay,
    description,
    check,
  }
}

