interface SSEMessage {
  projectId: string
  type: 'connected' | 'content' | 'done'
  content?: string
}

export const useWorker = () => {
  const eventSource = ref<EventSource | null>(null)

  const connectToWorker = (workerUrl: string, projectId: string, onMessage: (data: SSEMessage) => void) => {
    if (eventSource.value) {
      eventSource.value.close()
    }

    if (!projectId) {
      console.error('No projectId available for SSE connection')
      return
    }

    const subscribeUrl = `${workerUrl}/subscribe?projectId=${encodeURIComponent(projectId)}`
    const es = new EventSource(subscribeUrl)

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as SSEMessage
        onMessage(data)
      } catch (e) {
        console.error('Error parsing SSE message:', e)
      }
    }

    es.onerror = () => {
      console.error('SSE connection error')
      es.close()
    }

    eventSource.value = es
  }

  const sendChatMessage = async (workerUrl: string, projectId: string, prompt: string): Promise<void> => {
    await fetch(`${workerUrl}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        projectId,
        prompt,
      }),
    })
  }

  const disconnect = () => {
    if (eventSource.value) {
      eventSource.value.close()
      eventSource.value = null
    }
  }

  return {
    connectToWorker,
    sendChatMessage,
    disconnect,
  }
}

