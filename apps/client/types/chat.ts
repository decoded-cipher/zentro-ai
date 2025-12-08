export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface ProjectStatus {
  status: 'pending' | 'ready' | 'error'
  codeServerHost?: string
  devServerHost?: string | null
  workerHost?: string
  workerContainerId?: string
  message?: string
}

export type DevicePreviewMode = 'none' | 'mobile' | 'tablet' | 'desktop' | 'scale-out'

