<template>
  <div class="h-full w-full flex flex-col bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl shadow-[0_0_30px_rgba(0,0,0,0.05)] dark:shadow-[0_0_30px_rgba(0,0,0,0.3)]">
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
          <!-- <div
            :class="[
              'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold',
              message.role === 'user'
                ? 'bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-md shadow-orange-500/30'
                : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300',
            ]"
          >
            {{ message.role === 'user' ? 'U' : 'AI' }}
          </div> -->
          <div
            :class="[
              'flex-1 flex flex-col gap-2 min-w-0 max-w-full',
              message.role === 'user' ? 'items-end' : 'items-start',
            ]"
          >
            <template v-if="message.role === 'assistant'">
              <template v-for="(action, actionIndex) in getParsedMessage(message.content).actions" :key="`action-${actionIndex}`">
                <ActionCard
                  :label="getActionLabel(action)"
                  :content="action.content"
                  :file-path="action.attributes?.filePath"
                  :title="action.attributes?.title"
                  :is-collapsible="isFileAction(action)"
                  :default-expanded="!isFileAction(action)"
                />
              </template>
              
              <!-- Display remaining text if any (rendered as markdown) -->
              <div
                v-if="getParsedMessage(message.content).text"
                :class="[
                  'rounded-lg px-3 py-2 text-xs leading-relaxed markdown-content',
                  'bg-neutral-50 dark:bg-neutral-900/50 text-neutral-900 dark:text-neutral-100 border border-neutral-200 dark:border-neutral-700',
                ]"
                v-html="renderMarkdown(getParsedMessage(message.content).text)"
              />
            </template>
            
            <!-- User messages display normally -->
            <div
              v-else
              :class="[
                'rounded-xl px-3 py-2 text-xs leading-relaxed',
                'bg-gradient-to-br from-orange-500 via-red-500 to-rose-500 text-white shadow-md shadow-orange-500/20',
                'max-w-[85%] break-words',
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
    <div class="p-4 border-t border-neutral-200/80 dark:border-neutral-800/80 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-xl">
      <!-- Token usage for this chat -->
      <div
        v-if="tokenUsage.totalTokens > 0"
        class="mb-3 rounded-lg bg-neutral-100/90 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700/60 overflow-hidden"
      >
        <div class="px-2.5 py-1.5 flex items-center justify-between gap-2">
          <div class="flex items-center gap-1.5 min-w-0">
            <span class="text-[9px] font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400 shrink-0">
              Tokens
            </span>
            <span class="tabular-nums text-xs font-semibold text-neutral-800 dark:text-neutral-200">
              {{ formatTokens(tokenUsage.totalTokens) }}
            </span>
          </div>
          <div class="flex items-center gap-2 shrink-0 tabular-nums text-[10px]">
            <span
              class="flex items-center gap-1 text-emerald-600 dark:text-emerald-400"
              title="Input tokens"
            >
              <span class="w-1 h-1 rounded-full bg-emerald-500 dark:bg-emerald-400 shrink-0" />
              <span class="font-medium">{{ formatTokens(tokenUsage.inputTokens) }}</span>
              <span class="text-neutral-400 dark:text-neutral-500">in</span>
            </span>
            <span
              class="flex items-center gap-1 text-amber-600 dark:text-amber-400"
              title="Output tokens"
            >
              <span class="w-1 h-1 rounded-full bg-amber-500 dark:bg-amber-400 shrink-0" />
              <span class="font-medium">{{ formatTokens(tokenUsage.outputTokens) }}</span>
              <span class="text-neutral-400 dark:text-neutral-500">out</span>
            </span>
          </div>
        </div>
        <div
          class="h-0.5 flex bg-neutral-200/80 dark:bg-neutral-700/80"
          role="presentation"
          aria-hidden="true"
        >
          <span
            v-if="tokenUsage.inputTokens > 0"
            class="inline-block h-full bg-emerald-500 dark:bg-emerald-500/90 transition-all duration-500 ease-out"
            :style="{ width: `${inputPct}%` }"
          />
          <span
            v-if="tokenUsage.outputTokens > 0"
            class="inline-block h-full bg-amber-500 dark:bg-amber-500/90 transition-all duration-500 ease-out"
            :style="{ width: `${outputPct}%` }"
          />
        </div>
      </div>
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
            <div class="flex gap-2 p-3 items-end">
              <textarea
                ref="textareaRef"
                v-model="input"
                @keydown="handleKeyDown"
                :placeholder="isProjectReady ? 'Type your message...' : 'Waiting for workspace to be ready...'"
                :disabled="isLoading || !isProjectReady"
                rows="1"
                class="flex-1 bg-transparent border-none outline-none text-xs text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:ring-0 resize-none overflow-hidden min-h-[72px] leading-5"
                :style="{ height: textareaHeight }"
              />
              <Button
                type="submit"
                :disabled="!input.trim() || isLoading || !isProjectReady"
                variant="gradient"
                size="xs"
                class="flex-shrink-0 rounded-lg w-8 h-8 p-0 flex items-center justify-center disabled:opacity-30 transition-all shadow-md hover:shadow-lg"
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
  </div>
</template>

<script setup lang="ts">
import type { Message } from '~/types/chat'
import type { TokenUsage } from '~/composables/useChatMessages'

interface Props {
  messages: Message[]
  tokenUsage: TokenUsage
  isLoading: boolean
  isLoadingChat: boolean
  error: string | null
  isProjectReady: boolean
  input: string
}

const props = withDefaults(defineProps<Props>(), {
  tokenUsage: () => ({ inputTokens: 0, outputTokens: 0, totalTokens: 0 }),
})

const emit = defineEmits<{
  'update:input': [value: string]
  'send-message': []
}>()

const { parseMessage } = useMessageParser()
const { renderMarkdown } = useMarkdown()

const textareaRef = ref<HTMLTextAreaElement | null>(null)
const messagesEndRef = ref<HTMLDivElement | null>(null)
const textareaHeight = ref('28px')

// Cache parsed messages to avoid re-parsing on every render
const parsedMessagesCache = new Map<string, ReturnType<typeof parseMessage>>()

const getParsedMessage = (content: string) => {
  if (!parsedMessagesCache.has(content)) {
    parsedMessagesCache.set(content, parseMessage(content))
  }
  return parsedMessagesCache.get(content)!
}

// Helper functions for action parsing
const getActionLabel = (action: ReturnType<typeof parseMessage>['actions'][0]): string => {
  const actionType = action.attributes?.type
  if (actionType === 'file') return 'Creating'
  if (actionType === 'shell') return 'Running'
  return action.type === 'artifact' ? 'Creating' : 'Running'
}

const isFileAction = (action: ReturnType<typeof parseMessage>['actions'][0]): boolean => {
  return action.attributes?.type === 'file' || action.type === 'artifact'
}

const input = computed({
  get: () => props.input,
  set: (value) => emit('update:input', value)
})

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
      textareaHeight.value = `${textarea.scrollHeight}px`
    } else {
      textarea.style.height = `${maxHeight}px`
      textarea.style.overflowY = 'auto'
      textareaHeight.value = `${maxHeight}px`
    }
  })
})

// Scroll to bottom when new messages arrive
watch([() => props.messages, () => props.isLoading], () => {
  nextTick(() => {
    messagesEndRef.value?.scrollIntoView({ behavior: 'smooth' })
  })
})

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    if (input.value.trim() && !props.isLoading && props.isProjectReady) {
      emit('send-message')
    }
  }
}

const handleSendMessage = () => {
  if (!input.value.trim() || props.isLoading || !props.isProjectReady) return
  emit('send-message')
}

const formatTime = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date)
}

const formatTokens = (n: number) => {
  if (n >= 1000) return `${(n / 1000).toFixed(1)} K`
  return n.toString()
}

const inputPct = computed(() => {
  const t = props.tokenUsage.totalTokens
  if (!t) return 0
  return Math.round((props.tokenUsage.inputTokens / t) * 100)
})
const outputPct = computed(() => {
  const t = props.tokenUsage.totalTokens
  if (!t) return 0
  return Math.round((props.tokenUsage.outputTokens / t) * 100)
})
</script>

