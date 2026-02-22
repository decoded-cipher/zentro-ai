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
              <p class="text-xs font-medium text-foreground/50 uppercase tracking-wider mb-2 px-3 flex-shrink-0">Recent Projects</p>
              <div v-if="isLoading" class="px-3 py-2">
                <div class="animate-pulse space-y-2">
                  <div class="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4"></div>
                  <div class="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2"></div>
                  <div class="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-2/3"></div>
                </div>
              </div>
              <template v-else-if="projects.length > 0">
                <div class="overflow-y-auto max-h-full space-y-1">
                  <div
                    v-for="project in projects"
                    :key="project.id"
                    class="group"
                  >
                    <div
                      v-if="renamingProjectId === project.id"
                      class="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-orange-50 dark:bg-orange-900/20"
                    >
                      <svg class="w-5 h-5 flex-shrink-0 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                      <input
                        :ref="(el) => { renameInputRef = el as HTMLInputElement }"
                        v-model="renameValue"
                        @keydown.enter="saveRename(project.id)"
                        @keydown.escape="cancelRename"
                        @blur="saveRename(project.id)"
                        class="flex-1 min-w-0 bg-transparent text-sm font-medium text-foreground outline-none placeholder:text-foreground/40"
                        placeholder="Project name"
                      />
                    </div>
                    <button
                      v-else
                      @click="openProject(project.id)"
                      class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 text-left"
                      :class="[
                        route.path === `/chat/${project.id}`
                          ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                          : activeDropdownId === project.id
                            ? 'bg-orange-50 dark:bg-orange-900/20 text-foreground'
                            : 'text-foreground/70 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:text-foreground'
                      ]"
                    >
                      <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                      <span class="truncate flex-1">{{ project.name ?? 'New Project' }}</span>
                      <span
                        @click.stop="toggleDropdown(project.id, $event)"
                        class="p-1.5 -my-1 -mr-1 rounded-md transition-opacity text-foreground/40 hover:text-foreground/70 hover:bg-orange-100/60 dark:hover:bg-orange-900/30"
                        :class="activeDropdownId === project.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'"
                      >
                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM18 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </span>
                    </button>
                    <Teleport to="body">
                      <Transition name="dropdown">
                        <div
                          v-if="activeDropdownId === project.id"
                          @mousedown.stop
                          class="fixed w-40 p-1 bg-white dark:bg-neutral-800 rounded-lg shadow-lg ring-1 ring-black/5 dark:ring-white/10 z-[100]"
                          :style="dropdownPosition"
                        >
                          <button
                            @click="startRename(project)"
                            class="w-full flex items-center gap-2.5 px-3 py-1.5 text-sm rounded-lg text-foreground/80 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:text-foreground transition-colors"
                          >
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Rename
                          </button>
                        </div>
                      </Transition>
                    </Teleport>
                  </div>
                  
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

const activeDropdownId = ref<string | null>(null)
const dropdownPosition = ref<Record<string, string>>({})
const renamingProjectId = ref<string | null>(null)
const renameValue = ref('')
const renameInputRef = ref<HTMLInputElement | null>(null)

const fetchProjects = async (page = 1, append = false) => {
  if (page === 1) {
    isLoading.value = true
  } else {
    isLoadingMore.value = true
  }
  try {
    const response = await apiClient.get(`${API_ENDPOINTS.projects.getAll}?page=${page}`)
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

const openProject = (projectId: string) => {
  cancelRename()
  closeSidebar()
  router.push(`/chat/${projectId}`)
}

const toggleDropdown = (projectId: string, event: MouseEvent) => {
  if (activeDropdownId.value === projectId) {
    activeDropdownId.value = null
    return
  }
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  dropdownPosition.value = {
    top: `${rect.top}px`,
    left: `${rect.right + 6}px`,
  }
  activeDropdownId.value = projectId
}

const startRename = (project: Project) => {
  activeDropdownId.value = null
  renamingProjectId.value = project.id
  renameValue.value = project.name ?? ''
  nextTick(() => {
    renameInputRef.value?.focus()
    renameInputRef.value?.select()
  })
}

const saveRename = async (projectId: string) => {
  if (renamingProjectId.value !== projectId) return
  const trimmed = renameValue.value.trim()
  const proj = projects.value.find(p => p.id === projectId)
  if (!proj) { cancelRename(); return }

  const oldName = proj.name
  if (trimmed === (oldName ?? '')) { cancelRename(); return }

  proj.name = trimmed || null
  renamingProjectId.value = null

  try {
    await apiClient.patch(API_ENDPOINTS.projects.update(projectId), { name: trimmed || null })
  } catch (err) {
    console.error('Failed to rename project:', err)
    proj.name = oldName
  }
}

const cancelRename = () => {
  renamingProjectId.value = null
  renameValue.value = ''
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
  if (!force && (activeDropdownId.value || renamingProjectId.value)) return
  activeDropdownId.value = null
  cancelRename()
  closeTimeout = setTimeout(() => {
    isOpen.value = false
  }, 150)
}

const handleClickOutside = () => {
  activeDropdownId.value = null
}

onMounted(() => {
  fetchProjects()
  document.addEventListener('mousedown', handleClickOutside)
})

onUnmounted(() => {
  if (closeTimeout) {
    clearTimeout(closeTimeout)
  }
  document.removeEventListener('mousedown', handleClickOutside)
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

<style>
.dropdown-enter-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.dropdown-leave-active {
  transition: opacity 0.1s ease, transform 0.1s ease;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.95);
}
</style>
