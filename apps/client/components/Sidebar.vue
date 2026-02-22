<template>
  <div>
    <!-- Hover trigger zone on the left side -->
    <div
      class="fixed left-0 top-0 w-4 h-full z-40"
      @mouseenter="openSidebar"
    />

    <!-- Backdrop overlay -->
    <Transition name="fade">
      <div
        v-if="isOpen"
        class="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm z-40"
        @click="closeSidebar(true)"
      />
    </Transition>

    <!-- Sidebar overlay -->
    <Transition name="slide">
      <aside
        v-if="isOpen"
        class="fixed left-0 top-0 h-full w-72 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-r border-orange-200/50 dark:border-orange-800/50 shadow-2xl z-50"
        @mouseenter="keepOpen"
        @mouseleave="closeSidebar()"
      >
        <div class="flex flex-col h-full">
          <!-- Sidebar header -->
          <div class="p-4 border-b border-orange-200/30 dark:border-orange-800/30 flex items-center">
            <Logo to="/" />
          </div>

          <!-- Navigation items -->
          <nav class="flex-1 p-4 space-y-2 overflow-y-auto">
            <div class="pt-4 flex flex-col min-h-0">
              <p class="text-xs font-medium text-foreground/50 uppercase tracking-wider mb-2 px-3 flex-shrink-0">Recent Chats</p>
              <div v-if="isLoading" class="px-3 py-2">
                <div class="animate-pulse space-y-2">
                  <div class="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4"></div>
                  <div class="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2"></div>
                  <div class="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-2/3"></div>
                </div>
              </div>
              <template v-else-if="projects.length > 0">
                <div class="overflow-y-auto max-h-full space-y-1">
                  
                  <ProjectOptions
                    v-for="project in projects"
                    :key="project.id"
                    :project="project"
                    :active="route.path === `/chat/${project.id}`"
                    :pinned="!!project.pinnedAt"
                    @select="openProject(project.id)"
                    @active="isDropdownOpen = $event"
                    @pin="(pinned) => togglePin(project, pinned)"
                    @archive="archiveProject(project)"
                  />
                  
                  <!-- Load More Button -->
                  <button
                    v-if="hasMore"
                    @click="loadMore"
                    :disabled="isLoadingMore"
                    class="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg v-if="isLoadingMore" class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>{{ isLoadingMore ? 'Loading...' : 'Load more' }}</span>
                  </button>
                </div>
              </template>
              <p v-else class="px-3 py-2 text-xs text-foreground/50">No recent projects</p>
            </div>
          </nav>

          <!-- Sidebar footer -->
          <div class="p-4 border-t border-orange-200/30 dark:border-orange-800/30">
            <!-- Settings -->
            <button
              class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 text-foreground/70 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:text-foreground"
            >
              <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span class="truncate">Settings</span>
            </button>

            <!-- Help & Support -->
            <button
              class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 text-foreground/70 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:text-foreground"
            >
              <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span class="truncate">Help & Support</span>
            </button>
          </div>
        </div>
      </aside>
    </Transition>
  </div>
</template>

<script setup lang="ts">
interface Project {
  id: string
  name: string | null
  pinnedAt: number | null
  createdAt: number
  updatedAt: number
}

const { apiClient, API_ENDPOINTS } = useApi()
const route = useRoute()
const router = useRouter()

const isOpen = ref(false)
const projects = ref<Project[]>([])
const isLoading = ref(false)
const isLoadingMore = ref(false)
const hasMore = ref(false)
const currentPage = ref(1)
let closeTimeout: ReturnType<typeof setTimeout> | null = null

const isDropdownOpen = ref(false)

const fetchProjects = async (page = 1, append = false) => {
  if (page === 1) {
    isLoading.value = true
  } else {
    isLoadingMore.value = true
  }
  try {
    const response = await apiClient.get(`${API_ENDPOINTS.projects.getAll}?page=${page}&archived=false`)
    const newProjects = response.data.projects || []
    if (append) {
      projects.value = [...projects.value, ...newProjects]
    } else {
      projects.value = newProjects
    }
    hasMore.value = response.data.hasMore || false
    currentPage.value = page
  } catch (error) {
    console.error('Failed to fetch projects:', error)
    if (!append) {
      projects.value = []
    }
  } finally {
    isLoading.value = false
    isLoadingMore.value = false
  }
}

const loadMore = () => {
  if (!isLoadingMore.value && hasMore.value) {
    fetchProjects(currentPage.value + 1, true)
  }
}

const archiveProject = async (proj: Project) => {
  const archivedAt = Math.floor(Date.now() / 1000)
  projects.value = projects.value.filter(p => p.id !== proj.id)

  try {
    await apiClient.patch(API_ENDPOINTS.projects.update(proj.id), { archivedAt })
    if (route.path === `/chat/${proj.id}`) {
      router.push('/')
    }
  } catch (err) {
    console.error('Failed to archive project:', err)
    await fetchProjects()
  }
}

const togglePin = async (proj: Project, pinned: boolean) => {
  const previousPinnedAt = proj.pinnedAt
  const newPinnedAt = pinned ? Math.floor(Date.now() / 1000) : null
  proj.pinnedAt = newPinnedAt

  try {
    await apiClient.patch(API_ENDPOINTS.projects.update(proj.id), { pinnedAt: newPinnedAt })
    await fetchProjects()
  } catch (err) {
    console.error('Failed to toggle pin:', err)
    proj.pinnedAt = previousPinnedAt
  }
}

const openProject = (projectId: string) => {
  closeSidebar(true)
  router.push(`/chat/${projectId}`)
}

const openSidebar = () => {
  if (closeTimeout) {
    clearTimeout(closeTimeout)
    closeTimeout = null
  }
  isOpen.value = true
}

const keepOpen = () => {
  if (closeTimeout) {
    clearTimeout(closeTimeout)
    closeTimeout = null
  }
}

const closeSidebar = (force = false) => {
  if (!force && isDropdownOpen.value) return
  closeTimeout = setTimeout(() => {
    isOpen.value = false
  }, 150)
}

onMounted(() => {
  fetchProjects()
})

onUnmounted(() => {
  if (closeTimeout) {
    clearTimeout(closeTimeout)
  }
})
</script>

<style scoped>
/* Slide transition */
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(-100%);
}

/* Fade transition for backdrop */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
