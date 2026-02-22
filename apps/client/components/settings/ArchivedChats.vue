<template>
  <div>
    <p class="text-sm text-foreground/60 mb-4">Archived chats are hidden from the sidebar. You can restore or permanently delete them here.</p>

    <div v-if="loading" class="space-y-3">
      <div v-for="i in 3" :key="i" class="animate-pulse flex items-center gap-3 p-3 rounded-lg bg-muted/50">
        <div class="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-1/3" />
        <div class="flex-1" />
        <div class="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-16" />
      </div>
    </div>

    <div v-else-if="projects.length === 0" class="flex flex-col items-center justify-center py-16 text-center">
      <div class="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mb-3">
        <svg class="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7H4a1 1 0 01-1-1V4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-1 1z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 7v12a2 2 0 002 2h10a2 2 0 002-2V7" />
        </svg>
      </div>
      <p class="text-sm font-medium text-foreground/70">No archived chats</p>
      <p class="text-xs text-foreground/40 mt-1">Chats you archive will appear here</p>
    </div>

    <div v-else class="space-y-1.5">
      <div
        v-for="proj in projects"
        :key="proj.id"
        class="group flex items-center gap-3 px-3 py-2.5 rounded-lg border border-transparent hover:border-border hover:bg-muted/40 transition-all duration-150"
      >
        <svg class="w-4 h-4 flex-shrink-0 text-foreground/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
        </svg>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-foreground truncate">{{ proj.name ?? 'New Project' }}</p>
          <p class="text-xs text-foreground/40">Archived {{ formatDate(proj.archivedAt) }}</p>
        </div>
        <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            @click="unarchive(proj)"
            class="px-2.5 py-1 rounded-md text-xs font-medium text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
          >
            Unarchive
          </button>
          <button
            @click="remove(proj)"
            class="px-2.5 py-1 rounded-md text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      <button
        v-if="hasMore"
        @click="loadMore"
        :disabled="loadingMore"
        class="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 disabled:opacity-50 transition-colors mt-2"
      >
        <svg v-if="loadingMore" class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        {{ loadingMore ? 'Loading...' : 'Load more' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface ArchivedProject {
  id: string
  name: string | null
  archivedAt: number | null
  createdAt: number
  updatedAt: number
}

const { apiClient, API_ENDPOINTS } = useApi()

const projects = ref<ArchivedProject[]>([])
const loading = ref(false)
const loadingMore = ref(false)
const hasMore = ref(false)
const page = ref(1)

const fetchProjects = async (p = 1, append = false) => {
  if (p === 1) loading.value = true
  else loadingMore.value = true

  try {
    const response = await apiClient.get(`${API_ENDPOINTS.projects.getAll}?page=${p}&archived=true`)
    const items = response.data.projects || []
    if (append) {
      projects.value = [...projects.value, ...items]
    } else {
      projects.value = items
    }
    hasMore.value = response.data.hasMore || false
    page.value = p
  } catch (err) {
    console.error('Failed to fetch archived projects:', err)
    if (!append) projects.value = []
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

const loadMore = () => {
  if (!loadingMore.value && hasMore.value) {
    fetchProjects(page.value + 1, true)
  }
}

const unarchive = async (proj: ArchivedProject) => {
  projects.value = projects.value.filter(p => p.id !== proj.id)
  try {
    await apiClient.patch(API_ENDPOINTS.projects.update(proj.id), { archivedAt: null })
  } catch (err) {
    console.error('Failed to unarchive project:', err)
    await fetchProjects()
  }
}

const remove = async (proj: ArchivedProject) => {
  console.warn('Delete not yet implemented for project:', proj.id)
}

const formatDate = (timestamp: number | null) => {
  if (!timestamp) return ''
  const date = new Date(timestamp * 1000)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days} days ago`
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined })
}

onMounted(() => fetchProjects())

defineExpose({ refresh: () => fetchProjects() })
</script>
