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
      <!-- Main content area - Full width with horizontal tabs -->
      <main class="flex-1 flex flex-col overflow-hidden bg-white dark:bg-neutral-950 border-r border-neutral-200/80 dark:border-neutral-800/80">
        <div class="flex-1 flex flex-col">
          <!-- Horizontal tabs at the top -->
          <div class="border-b border-neutral-200/80 dark:border-neutral-800/80 bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl">
            <div class="flex gap-1 px-6 pt-3">
              <button
                v-for="tab in tabs"
                :key="tab.value"
                @click="activeTab = tab.value"
                :class="[
                  'group relative px-5 py-2.5 text-sm font-medium transition-all duration-200 flex items-center gap-2',
                  activeTab === tab.value
                    ? 'text-neutral-900 dark:text-white bg-gradient-to-r from-orange-500/10 via-red-500/10 to-rose-500/10 rounded-t-lg'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50 hover:rounded-t-lg',
                ]"
              >
                <span :class="['opacity-60', activeTab === tab.value && 'opacity-100 transition-opacity']">
                  <component :is="tab.icon" />
                </span>
                <span>{{ tab.label }}</span>
                <div
                  v-if="activeTab === tab.value"
                  class="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 via-red-500 to-rose-500 rounded-full"
                />
              </button>
            </div>
          </div>

          <!-- Tab content -->
          <div class="flex-1 overflow-hidden relative">
            <!-- Code Editor Tab -->
            <div v-if="activeTab === 'code'" class="absolute inset-0 bg-[#1e1e1e] dark:bg-black">
              <IframePlaceholder
                :src="codeServerUrl"
                title="Code Editor"
                placeholder-title="Code Editor"
                :placeholder-description="isProjectReady ? 'VS Code Server' : 'Provisioning VS Code Server...'"
                :show-overlay="!isProjectReady"
              />
            </div>

            <!-- Preview Tab -->
            <div v-if="activeTab === 'preview'" class="absolute inset-0 bg-white dark:bg-neutral-950 m-2 border border-neutral-200/80 dark:border-neutral-800/80 rounded overflow-hidden">
              <IframePlaceholder
                :src="previewSrc"
                title="Preview"
                placeholder-title="Live Preview"
                :placeholder-description="previewDescription"
                :show-overlay="showPreviewOverlay"
              >
                <template #icon>
                  <svg
                    class="w-12 h-12 text-neutral-300 dark:text-neutral-700"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="1.5"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="1.5"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                </template>
              </IframePlaceholder>
            </div>
          </div>
        </div>
      </main>

      <!-- Right panel - Chat -->
      <aside class="w-[350px] flex flex-col bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl shadow-[0_0_30px_rgba(0,0,0,0.05)] dark:shadow-[0_0_30px_rgba(0,0,0,0.3)]">
        <!-- Messages -->
        <div class="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar">
          <div v-if="isLoadingChat" class="flex items-center justify-center h-full">
            <div class="flex flex-col items-center gap-4">
              <div class="w-10 h-10 border-3 border-neutral-200 dark:border-neutral-800 border-t-orange-500 rounded-full animate-spin" />
              <p class="text-sm text-neutral-500 dark:text-neutral-400">Loading...</p>
            </div>
          </div>

          <div v-else-if="error" class="flex flex-col items-center justify-center h-full gap-4">
            <div class="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
              <svg
                class="w-7 h-7 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div class="text-center max-w-xs">
              <p class="text-sm font-medium text-red-600 dark:text-red-400 mb-2">Error</p>
              <p class="text-xs text-neutral-500 dark:text-neutral-400 mb-4">{{ error }}</p>
              <Button
                variant="outline"
                size="sm"
                @click="window.location.reload()"
                class="h-9 px-4 text-sm border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
              >
                Retry
              </Button>
            </div>
          </div>

          <div v-else-if="messages.length === 0" class="flex flex-col items-center justify-center h-full gap-4">
            <div class="relative">
              <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-100 to-rose-100 dark:from-orange-900/20 dark:to-rose-900/20 flex items-center justify-center">
                <svg
                  class="w-8 h-8 text-orange-500 dark:text-orange-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
            </div>
            <div class="text-center max-w-xs">
              <p class="text-sm font-medium text-neutral-900 dark:text-white mb-1">Start a conversation</p>
              <p class="text-xs text-neutral-500 dark:text-neutral-400">
                Ask me anything to build your application
              </p>
            </div>
          </div>

          <template v-else>
            <div
              v-for="(message, index) in messages"
              :key="message.id"
              :class="[
                'flex gap-2 animate-in fade-in-up',
                message.role === 'user' ? 'flex-row-reverse' : '',
              ]"
              :style="{ animationDelay: `${index * 0.03}s` }"
            >
              <div
                :class="[
                  'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold',
                  message.role === 'user'
                    ? 'bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-md shadow-orange-500/30'
                    : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300',
                ]"
              >
                {{ message.role === 'user' ? 'U' : 'AI' }}
              </div>
              <div
                :class="[
                  'flex-1 flex flex-col gap-1',
                  message.role === 'user' ? 'items-end' : 'items-start',
                ]"
              >
                <div
                  :class="[
                    'rounded-xl px-4 py-2.5 text-sm leading-relaxed',
                    message.role === 'user'
                      ? 'bg-gradient-to-br from-orange-500 via-red-500 to-rose-500 text-white shadow-md shadow-orange-500/20'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border border-neutral-200 dark:border-neutral-700',
                  ]"
                >
                  {{ message.content }}
                </div>
                <span
                  :class="[
                    'text-[10px] text-neutral-400 dark:text-neutral-600 px-1',
                    message.role === 'user' ? 'text-right' : '',
                  ]"
                >
                  {{ formatTime(message.timestamp) }}
                </span>
              </div>
            </div>
            <div v-if="isLoading" class="flex gap-2 animate-in fade-in">
              <div class="flex-shrink-0 w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-xs font-bold text-neutral-600 dark:text-neutral-300">
                AI
              </div>
              <div class="bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-4 py-3">
                <div class="flex gap-1.5">
                  <span
                    class="w-2 h-2 rounded-full bg-orange-500 animate-bounce"
                    :style="{ animationDelay: '0s' }"
                  />
                  <span
                    class="w-2 h-2 rounded-full bg-red-500 animate-bounce"
                    :style="{ animationDelay: '0.15s' }"
                  />
                  <span
                    class="w-2 h-2 rounded-full bg-rose-500 animate-bounce"
                    :style="{ animationDelay: '0.3s' }"
                  />
                </div>
              </div>
            </div>
            <div ref="messagesEndRef" />
          </template>
        </div>

        <!-- Input -->
        <div class="px-6 py-4 border-t border-neutral-200/80 dark:border-neutral-800/80 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-xl">
          <!-- Status indicator when not ready -->
          <div v-if="!isProjectReady" class="mb-3 p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded-full bg-orange-500 animate-pulse" />
              <span class="text-sm text-orange-700 dark:text-orange-300">
                Setting up your workspace...
              </span>
            </div>
          </div>
          
          <form @submit.prevent="handleSendMessage" class="relative">
            <div class="relative group">
              <div class="absolute -inset-0.5 bg-gradient-to-r from-orange-500 via-red-500 to-rose-500 rounded-xl opacity-0 group-focus-within:opacity-10 blur-md transition-opacity duration-300" />
              <div :class="['relative bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl transition-all duration-300', isProjectReady ? 'group-focus-within:border-orange-400 dark:group-focus-within:border-orange-500 group-focus-within:shadow-lg group-focus-within:shadow-orange-500/10' : 'opacity-60']">
                <div :class="`flex gap-2 p-3 ${isMaxHeight ? 'items-end' : 'items-center'}`">
                  <textarea
                    ref="textareaRef"
                    v-model="input"
                    @keydown="handleKeyDown"
                    :placeholder="isProjectReady ? 'Type your message...' : 'Waiting for workspace to be ready...'"
                    :disabled="isLoading || !isProjectReady"
                    rows="1"
                    class="flex-1 bg-transparent border-none outline-none text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:ring-0 resize-none overflow-hidden min-h-[20px] leading-5"
                    :style="{ height: textareaHeight }"
                  />
                  <Button
                    type="submit"
                    :disabled="!input.trim() || isLoading || !isProjectReady"
                    variant="gradient"
                    size="sm"
                    class="flex-shrink-0 rounded-lg w-9 h-9 p-0 flex items-center justify-center disabled:opacity-30 transition-all shadow-md hover:shadow-lg"
                  >
                    <svg
                      class="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M5 10l7-7m0 0l7 7m-7-7v18"
                      />
                    </svg>
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ProjectStatus {
  status: 'pending' | 'ready' | 'error'
  codeServerHost?: string
  devServerHost?: string | null
  workerHost?: string
  workerContainerId?: string
  message?: string
}

const route = useRoute()
const chatId = computed(() => route.params.chat_id as string)
const { apiClient, API_ENDPOINTS } = useApi()
const { connectToWorker, sendChatMessage, disconnect } = useWorker()

const messages = ref<Message[]>([])
const input = ref('')
const activeTab = ref('code')
const isLoading = ref(false)
const isLoadingChat = ref(false)
const error = ref<string | null>(null)
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const isMaxHeight = ref(false)
const messagesEndRef = ref<HTMLDivElement | null>(null)
const textareaHeight = ref('20px')

const isProjectReady = ref(false)
const codeServerUrl = ref('')
const previewUrl = ref('')
const workerHost = ref('')
const statusPollInterval = ref<ReturnType<typeof setInterval> | null>(null)
const isCheckingDevServer = ref(false)
const isDevServerAvailable = ref(false)

// Computed properties for preview
const previewSrc = computed(() => isDevServerAvailable.value && previewUrl.value ? previewUrl.value : '')
const showPreviewOverlay = computed(() => !isProjectReady.value || !previewUrl.value || isCheckingDevServer.value || !isDevServerAvailable.value)
const previewDescription = computed(() => {
  if (!isProjectReady.value) return 'Waiting for project to be ready...'
  if (!previewUrl.value) return 'Dev server not configured'
  if (isCheckingDevServer.value) return 'Checking dev server...'
  if (!isDevServerAvailable.value) return 'Dev server not running. Start your dev server in the terminal.'
  return 'Your application preview'
})

const tabs = [
  {
    value: 'code',
    label: 'Code Editor',
    icon: () => h('svg', { class: 'w-4 h-4', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': '2',
        d: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4',
      }),
    ]),
  },
  {
    value: 'preview',
    label: 'Preview',
    icon: () => h('svg', { class: 'w-4 h-4', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': '2',
        d: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z',
      }),
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': '2',
        d: 'M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
      }),
    ]),
  },
]

// Auto-resize textarea
watch(input, () => {
  nextTick(() => {
    const textarea = textareaRef.value
    if (!textarea) return

    textarea.style.height = 'auto'
    const lineHeight = parseInt(getComputedStyle(textarea).lineHeight) || 24
    const maxHeight = lineHeight * 4

    if (textarea.scrollHeight <= maxHeight) {
      textarea.style.height = `${textarea.scrollHeight}px`
      textarea.style.overflowY = 'hidden'
      isMaxHeight.value = false
      textareaHeight.value = `${textarea.scrollHeight}px`
    } else {
      textarea.style.height = `${maxHeight}px`
      textarea.style.overflowY = 'auto'
      isMaxHeight.value = true
      textareaHeight.value = `${maxHeight}px`
    }
  })
})

const fetchMessages = async () => {
  if (!chatId.value) return
  
  try {
    const response = await apiClient.get<{ messages: any[] }>(API_ENDPOINTS.projects.messages(chatId.value))
    const dbMessages = response.data.messages
    
    if (dbMessages && dbMessages.length > 0) {
        messages.value = dbMessages.map((msg: any) => ({
        id: msg.id,
        role: msg.type === 'USER' ? 'user' : 'assistant',
        content: msg.text,
        timestamp: new Date(msg.createdAt * 1000),
        }))
    }
  } catch (err) {
    console.error('Error fetching messages:', err)
  }
}

const checkDevServerAvailability = async (url: string): Promise<boolean> => {
  if (!url) return false
  
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000)
    
    await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      cache: 'no-cache'
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

const pollProjectStatus = async () => {
  if (!chatId.value) return

  try {
    const response = await apiClient.get<ProjectStatus>(API_ENDPOINTS.projects.status(chatId.value))
    const data = response.data

    if (data.status === 'ready' && data.codeServerHost) {
      isProjectReady.value = true
      codeServerUrl.value = data.codeServerHost
      workerHost.value = data.workerHost || ''
      
      const newPreviewUrl = data.devServerHost || ''
      if (previewUrl.value !== newPreviewUrl) {
        previewUrl.value = newPreviewUrl
        isDevServerAvailable.value = false
      }

      if (statusPollInterval.value) {
        clearInterval(statusPollInterval.value)
        statusPollInterval.value = null
      }

      if (workerHost.value) {
        connectToWorker(workerHost.value, chatId.value, handleSSEMessage)
      }
    }
  } catch (err) {
    console.error('Error polling project status:', err)
  }
}

const handleSSEMessage = (data: { projectId: string; type: string; content?: string }) => {
  if (data.type === 'content' && data.content) {
    let lastMsg = messages.value[messages.value.length - 1]
    if (!lastMsg || lastMsg.role !== 'assistant') {
      lastMsg = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      }
      messages.value.push(lastMsg)
    }
    lastMsg.content += data.content
  } else if (data.type === 'done') {
    isLoading.value = false
    fetchMessages()
  }
}

// Scroll to bottom when new messages arrive
watch([messages, isLoading], () => {
  nextTick(() => {
    messagesEndRef.value?.scrollIntoView({ behavior: 'smooth' })
  })
})

// Check dev server when switching to preview tab
watch(activeTab, async (tab: string) => {
  if (tab === 'preview' && previewUrl.value && isProjectReady.value) {
    isCheckingDevServer.value = true
    isDevServerAvailable.value = await checkDevServerAvailability(previewUrl.value)
    isCheckingDevServer.value = false
  }
})

onMounted(() => {
  if (!chatId.value) return

  fetchMessages()
  pollProjectStatus()
  statusPollInterval.value = setInterval(pollProjectStatus, 5000)
})

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    if (input.value.trim() && !isLoading.value && isProjectReady.value) {
      handleSendMessage(e as any)
    }
  }
}

const handleSendMessage = async (e: Event) => {
  e.preventDefault()
  if (!input.value.trim() || isLoading.value || !chatId.value || !isProjectReady.value) return

  const messageContent = input.value.trim()
  input.value = ''
  isLoading.value = true

  const userMessage: Message = {
    id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    role: 'user',
    content: messageContent,
    timestamp: new Date(),
  }

  messages.value.push(userMessage)

  try {
    if (workerHost.value) {
      await sendChatMessage(workerHost.value, chatId.value, messageContent)
    } else {
      await apiClient.post(API_ENDPOINTS.chat.create(chatId.value), {
        prompt: messageContent,
      })
    }
  } catch (error: any) {
    console.error('Error sending message:', error)
    messages.value = messages.value.filter((msg) => msg.id !== userMessage.id)
    isLoading.value = false
  }
}

onUnmounted(() => {
  if (statusPollInterval.value) {
    clearInterval(statusPollInterval.value)
    statusPollInterval.value = null
  }
  disconnect()
})

const formatTime = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date)
}
</script>

