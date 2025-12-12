<template>
  <div class="h-screen flex flex-col bg-neutral-50 dark:bg-neutral-950 relative overflow-hidden">
    <!-- Subtle mesh gradient background -->
    <div class="absolute inset-0 opacity-40 dark:opacity-20">
      <div class="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_50%,rgba(255,119,89,0.15),transparent_50%)]" />
      <div class="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_50%,rgba(239,68,68,0.15),transparent_50%)]" />
      <div class="absolute bottom-0 left-1/2 w-full h-full bg-[radial-gradient(circle_at_50%_80%,rgba(251,113,133,0.1),transparent_50%)]" />
    </div>

    <Sidebar />

    <PageHeader />

    <!-- Main workspace -->
    <div class="flex-1 flex overflow-hidden relative z-10">
      <!-- Main content area - Preview Panel -->
      <main class="flex-1 flex flex-col overflow-hidden bg-white dark:bg-neutral-950 border-r border-neutral-200/80 dark:border-neutral-800/80">
        <PreviewPanel
          :active-tab="activeTab"
          :code-server-url="codeServerUrl"
          :preview-src="previewSrc"
          :preview-description="previewDescription"
          :show-preview-overlay="showPreviewOverlay"
          :is-project-ready="isProjectReady"
          :device-preview-mode="devicePreviewMode"
          :is-downloading="isDownloading"
          @tab-change="activeTab = $event"
          @device-preview-change="devicePreviewMode = $event"
          @download-project="handleDownloadProject"
        />
      </main>

      <!-- Right panel - Chat -->
      <aside class="w-[350px]">
        <ChatPanel
          :messages="messages"
          :is-loading="isLoading"
          :is-loading-chat="isLoadingChat"
          :error="error"
          :is-project-ready="isProjectReady"
          v-model:input="input"
          @send-message="handleSendMessage"
        />
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DevicePreviewMode } from '~/types/chat'

const route = useRoute()
const chatId = computed(() => route.params.chat_id as string)

// Composables
const { apiClient, API_ENDPOINTS } = useApi()
const { connectToWorker, sendChatMessage, disconnect } = useWorker()

// Project status management
const projectStatus = useProjectStatus(chatId)
const { 
  isProjectReady, 
  codeServerUrl, 
  previewUrl, 
  workerHost,
  startPolling,
  stopPolling,
} = projectStatus

// Dev server management
const devServer = useDevServer(previewUrl, isProjectReady)
const { 
  previewSrc, 
  showOverlay: showPreviewOverlay, 
  description: previewDescription,
  check: checkDevServer,
} = devServer

// Chat messages management
const chatMessages = useChatMessages(chatId)
const { 
  messages, 
  isLoading,
  isLoadingChat, 
  error,
  fetchMessages,
  addMessage,
  updateLastMessage,
  removeMessage,
  setLoading,
} = chatMessages

// Local UI state
const input = ref('')
const activeTab = ref('code')
const devicePreviewMode = ref<DevicePreviewMode>('none')
const isDownloading = ref(false)

// SSE message handler
const handleSSEMessage = (data: { projectId: string; type: string; content?: string }) => {
  if (data.type === 'content' && data.content) {
    updateLastMessage(data.content)
  } else if (data.type === 'done') {
    setLoading(false)
    fetchMessages()
  }
}

// Initialize worker connection when project is ready
const initializeWorker = (host: string) => {
  if (host && chatId.value) {
    connectToWorker(host, chatId.value, handleSSEMessage)
  }
}

// Check dev server when switching to preview tab
watch(activeTab, async (tab: string) => {
  if (tab === 'preview' && previewUrl.value && isProjectReady.value) {
    await checkDevServer()
  }
})

// Send message handler
const handleSendMessage = async () => {
  if (!input.value.trim() || isLoading.value || !chatId.value || !isProjectReady.value) return

  const messageContent = input.value.trim()
  input.value = ''
  setLoading(true)

  const userMessage = {
    id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    role: 'user' as const,
    content: messageContent,
    timestamp: new Date(),
  }

  addMessage(userMessage)

  try {
    if (workerHost.value) {
      await sendChatMessage(workerHost.value, chatId.value, messageContent)
    } else {
      await apiClient.post(API_ENDPOINTS.chat.create(chatId.value), {
        prompt: messageContent,
      })
    }
  } catch (err: any) {
    console.error('Error sending message:', err)
    removeMessage(userMessage.id)
    setLoading(false)
  }
}

// Download project handler
const handleDownloadProject = async () => {
  if (!chatId.value || !workerHost.value || !isProjectReady.value || isDownloading.value) {
    console.error('Cannot download: missing projectId, workerHost, project not ready, or already downloading')
    return
  }

  isDownloading.value = true

  try {
    const workerUrl = `${workerHost.value}/download?projectId=${chatId.value}`
    
    // Fetch the zip file
    const response = await fetch(workerUrl, {
      method: 'GET',
    })

    if (!response.ok) {
      throw new Error(`Failed to download project: ${response.statusText}`)
    }

    // Get the blob
    const blob = await response.blob()
    
    // Create a download link
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `project-${chatId.value}-${Date.now()}.zip`
    document.body.appendChild(a)
    a.click()
    
    // Cleanup
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  } catch (err: any) {
    console.error('Error downloading project:', err)
    alert('Failed to download project. Please try again.')
  } finally {
    isDownloading.value = false
  }
}

// Lifecycle
onMounted(() => {
  if (!chatId.value) return

  fetchMessages()
  startPolling(initializeWorker)
})

onUnmounted(() => {
  stopPolling()
  disconnect()
})
</script>

