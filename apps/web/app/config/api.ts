import axios from "axios";

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});


apiClient.interceptors.request.use(
  async (config) => {
    if (typeof window !== 'undefined') {
      try {
        const { getToken } = await import('@clerk/nextjs');
        const token = await getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.error("Error fetching auth token:", error);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const API_ENDPOINTS = {
  chats: {
    create: "/chats",
    get: (chatId: string) => `/chats/${chatId}`,
    sendMessage: (chatId: string) => `/chats/${chatId}/messages`,
  },
};

