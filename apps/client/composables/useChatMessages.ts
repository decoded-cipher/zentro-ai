import type { Message } from '~/types/chat'

export const useChatMessages = (chatId: ComputedRef<string>) => {
  const { apiClient, API_ENDPOINTS } = useApi()

  const messages = ref<Message[]>([])
  const isLoading = ref(false)
  const isLoadingChat = ref(false)
  const error = ref<string | null>(null)

  const fetchMessages = async () => {
    if (!chatId.value) return

    isLoadingChat.value = true
    error.value = null

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
      error.value = 'Failed to load messages'
    } finally {
      isLoadingChat.value = false
    }
  }

  const addMessage = (message: Message) => {
    messages.value.push(message)
  }

  const updateLastMessage = (content: string) => {
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
    lastMsg.content += content
  }

  const removeMessage = (messageId: string) => {
    messages.value = messages.value.filter((msg) => msg.id !== messageId)
  }

  const clearError = () => {
    error.value = null
  }

  return {
    messages: readonly(messages),
    isLoading: readonly(isLoading),
    isLoadingChat: readonly(isLoadingChat),
    error: readonly(error),
    fetchMessages,
    addMessage,
    updateLastMessage,
    removeMessage,
    setLoading: (value: boolean) => { isLoading.value = value },
    clearError,
    isLoadingRef: isLoading, // Expose ref for direct updates in parent if needed
  }
}

