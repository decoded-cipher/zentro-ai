import type { ProjectStatus } from '~/types/chat'

export const useProjectStatus = (chatId: ComputedRef<string>) => {
  const { apiClient, API_ENDPOINTS } = useApi()

  const isProjectReady = ref(false)
  const codeServerUrl = ref('')
  const previewUrl = ref('')
  const workerHost = ref('')
  const statusPollInterval = ref<ReturnType<typeof setInterval> | null>(null)
  const hasTriggeredProvision = ref(false)

  const pollStatus = async (): Promise<{ shouldConnect: boolean; workerHost: string | null }> => {
    if (!chatId.value) {
      return { shouldConnect: false, workerHost: null }
    }

    try {
      const response = await apiClient.get<ProjectStatus>(API_ENDPOINTS.projects.status(chatId.value))
      const data = response.data

      if (data.status === 'pending' && !hasTriggeredProvision.value) {
        hasTriggeredProvision.value = true
        await apiClient.post(API_ENDPOINTS.projects.provision(chatId.value))
      }

      if (data.status === 'ready' && data.codeServerHost) {
        isProjectReady.value = true
        codeServerUrl.value = data.codeServerHost
        workerHost.value = data.workerHost || ''
        previewUrl.value = data.devServerHost || ''

        // Stop polling once ready
        if (statusPollInterval.value) {
          clearInterval(statusPollInterval.value)
          statusPollInterval.value = null
        }

        return { shouldConnect: true, workerHost: workerHost.value }
      }
    } catch (err) {
      console.error('Error polling project status:', err)
    }

    return { shouldConnect: false, workerHost: null }
  }

  const startPolling = (onReady?: (workerHost: string) => void) => {
    if (!chatId.value) return

    // Initial poll
    pollStatus().then(({ shouldConnect, workerHost: host }) => {
      if (shouldConnect && host && onReady) {
        onReady(host)
      }
    })

    // Poll every 5 seconds
    statusPollInterval.value = setInterval(async () => {
      const { shouldConnect, workerHost: host } = await pollStatus()
      if (shouldConnect && host && onReady) {
        onReady(host)
      }
    }, 5000)
  }

  const stopPolling = () => {
    if (statusPollInterval.value) {
      clearInterval(statusPollInterval.value)
      statusPollInterval.value = null
    }
  }

  const reset = () => {
    isProjectReady.value = false
    codeServerUrl.value = ''
    previewUrl.value = ''
    workerHost.value = ''
    hasTriggeredProvision.value = false
    stopPolling()
  }

  return {
    isProjectReady: readonly(isProjectReady),
    codeServerUrl: readonly(codeServerUrl),
    previewUrl: readonly(previewUrl),
    workerHost: readonly(workerHost),
    startPolling,
    stopPolling,
    reset,
  }
}

