import { defineStore } from 'pinia'

export interface Project {
  id: string
  name: string | null
  pinnedAt: number | null
  createdAt: number
  updatedAt: number
}

export const useProjectsStore = defineStore('projects', () => {
  const { apiClient, API_ENDPOINTS } = useApi()

  const projects = ref<Project[]>([])
  const isLoading = ref(false)
  const isLoadingMore = ref(false)
  const hasMore = ref(false)
  const currentPage = ref(1)

  async function fetchProjects(page = 1, append = false) {
    if (page === 1) {
      isLoading.value = true
    } else {
      isLoadingMore.value = true
    }

    try {
      const response = await apiClient.get(`${API_ENDPOINTS.projects.getAll}?page=${page}&archived=false`)
      const newProjects = (response.data.projects ?? []) as Project[]

      if (append) {
        projects.value = [...projects.value, ...newProjects]
      } else {
        projects.value = newProjects
      }

      hasMore.value = response.data.hasMore ?? false
      currentPage.value = page
    } catch (err) {
      console.error('Failed to fetch projects:', err)
      if (!append) {
        projects.value = []
      }
    } finally {
      isLoading.value = false
      isLoadingMore.value = false
    }
  }

  async function loadMore() {
    if (!isLoadingMore.value && hasMore.value) {
      await fetchProjects(currentPage.value + 1, true)
    }
  }

  function addProject(project: Project) {
    const exists = projects.value.some((p) => p.id === project.id)
    if (!exists) {
      projects.value = [project, ...projects.value]
    }
  }

  function removeProject(projectId: string) {
    projects.value = projects.value.filter((p) => p.id !== projectId)
  }

  function updateProject(projectId: string, updates: Partial<Project>) {
    const idx = projects.value.findIndex((p) => p.id === projectId)
    if (idx !== -1) {
      projects.value[idx] = { ...projects.value[idx], ...updates }
    }
  }

  async function archiveProject(project: Project) {
    const archivedAt = Math.floor(Date.now() / 1000)
    removeProject(project.id)

    try {
      await apiClient.patch(API_ENDPOINTS.projects.update(project.id), { archivedAt })
    } catch (err) {
      console.error('Failed to archive project:', err)
      await fetchProjects()
    }
  }

  async function togglePin(project: Project, pinned: boolean) {
    const previousPinnedAt = project.pinnedAt
    const newPinnedAt = pinned ? Math.floor(Date.now() / 1000) : null

    updateProject(project.id, { pinnedAt: newPinnedAt })

    try {
      await apiClient.patch(API_ENDPOINTS.projects.update(project.id), { pinnedAt: newPinnedAt })
      await fetchProjects()
    } catch (err) {
      console.error('Failed to toggle pin:', err)
      updateProject(project.id, { pinnedAt: previousPinnedAt })
    }
  }

  return {
    projects,
    isLoading,
    isLoadingMore,
    hasMore,
    currentPage,
    fetchProjects,
    loadMore,
    addProject,
    removeProject,
    updateProject,
    archiveProject,
    togglePin,
  }
})
