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
          @tab-change="activeTab = $event"
          @device-preview-change="devicePreviewMode = $event"
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

