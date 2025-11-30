import axios from 'axios'

export const useApi = () => {
  const config = useRuntimeConfig()
  
  const apiClient = axios.create({
    baseURL: config.public.apiBaseUrl,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  // Add auth token interceptor
  apiClient.interceptors.request.use(
    async (config) => {
      if (process.client) {
        try {
          const clerk = useClerk()
          if (clerk.session) {
            const token = await clerk.session.getToken()
            if (token) {
              config.headers.Authorization = `Bearer ${token}`
            }
          }
        } catch (error) {
          console.error('Error fetching auth token:', error)
        }
      }
      return config
    },
    (error) => Promise.reject(error)
  )

  const API_ENDPOINTS = {
    projects: {
      create: '/projects',
      getAll: '/projects',
      get: (projectId: string) => `/projects/${projectId}`,
    },
    chat: {
      create: (projectId: string) => `/projects/${projectId}/chat`,
      getAll: (projectId: string) => `/projects/${projectId}/chat`,
    },
  }

  return {
    apiClient,
    API_ENDPOINTS,
  }
}

