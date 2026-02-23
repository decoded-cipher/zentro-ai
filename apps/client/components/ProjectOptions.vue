<template>
  <div
    v-if="isRenaming"
    class="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-orange-50 dark:bg-orange-900/20"
  >
    <svg class="w-5 h-5 flex-shrink-0 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
    <input
      :ref="(el) => { renameInputRef = el as HTMLInputElement }"
      v-model="renameValue"
      @keydown.enter="saveRename"
      @keydown.escape="cancelRename"
      @blur="saveRename"
      class="flex-1 min-w-0 bg-transparent text-sm font-medium text-foreground outline-none placeholder:text-foreground/40"
      placeholder="Project name"
    />
  </div>
  <button
    v-else
    @click="emit('select')"
    class="group relative w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 text-left"
    :class="[
      active
        ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
        : isDropdownOpen
          ? 'bg-orange-50 dark:bg-orange-900/20 text-foreground'
          : 'text-foreground/70 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:text-foreground'
    ]"
  >
    <svg class="w-5 h-5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
    </svg>
    <span class="truncate flex-1">{{ project.name ?? 'New Project' }}</span>
    
    <span
      v-if="pinned"
      class="p-1.5 -my-1 -mr-1 text-orange-400 dark:text-orange-500 transition-opacity group-hover:opacity-0"
      :class="isDropdownOpen ? 'opacity-0' : 'opacity-100'"
    >
      <svg class="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
        <path d="M9.828.722a.5.5 0 0 1 .354.146l4.95 4.95a.5.5 0 0 1 0 .707c-.48.48-1.072.588-1.503.588-.178 0-.33-.018-.446-.036l-3.02 3.02a4 4 0 0 1 .166 1.181c0 .793-.465 1.63-1.38 2.399l-.397.344a.5.5 0 0 1-.725-.05L5.6 10.794 2.354 14.04a.5.5 0 1 1-.708-.708L4.9 10.08 1.676 6.828a.5.5 0 0 1-.05-.726l.344-.396C2.74 4.79 3.577 4.326 4.37 4.326c.408 0 .804.06 1.18.166l3.02-3.02a3 3 0 0 1-.036-.447c0-.432.108-1.022.589-1.503a.5.5 0 0 1 .353-.146z" />
      </svg>
    </span>

    <span
      @click.stop="toggleDropdown($event)"
      class="p-1.5 -my-1 -mr-1 rounded-md transition-opacity text-foreground/40 hover:text-foreground/70 hover:bg-orange-100/60 dark:hover:bg-orange-900/30"
      :class="[
        isDropdownOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
        pinned ? 'absolute right-3' : ''
      ]"
    >
      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM18 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    </span>
    
  </button>
  <Teleport to="body">
    <Transition name="dropdown">
      <div
        v-if="isDropdownOpen"
        @mousedown.stop
        class="fixed w-44 p-1 bg-white dark:bg-neutral-800 rounded-lg shadow-lg ring-1 ring-black/5 dark:ring-white/10 z-[100]"
        :style="dropdownPosition"
      >
        <button
          disabled
          class="w-full flex items-center gap-2.5 px-2 py-1.5 text-[13px] font-medium rounded-lg text-foreground/40 cursor-not-allowed opacity-60 transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Share
        </button>
        <button
          @click="startRename"
          class="w-full flex items-center gap-2.5 px-2 py-1.5 text-[13px] font-medium rounded-lg text-foreground/80 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:text-foreground transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Rename
        </button>
        <button
          disabled
          class="w-full flex items-center justify-between px-2 py-1.5 text-[13px] font-medium rounded-lg text-foreground/40 cursor-not-allowed opacity-60 transition-colors"
        >
          <span class="flex items-center gap-2.5">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            Move to folder
          </span>
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <div class="mx-2 my-1 border-t border-black/5 dark:border-white/10" />
        <button
          @click="togglePin"
          class="w-full flex items-center gap-2.5 px-2 py-1.5 text-[13px] font-medium rounded-lg text-foreground/80 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:text-foreground transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 3l-4 4-4-1-3 3 5 5-4 4h2l3-3 5 5 3-3-1-4 4-4-6-6z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 19l4-4" />
          </svg>
          {{ pinned ? 'Unpin chat' : 'Pin chat' }}
        </button>
        <button
          @click="archiveProject"
          class="w-full flex items-center gap-2.5 px-2 py-1.5 text-[13px] font-medium rounded-lg text-foreground/80 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:text-foreground transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7H4a1 1 0 01-1-1V4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-1 1z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 7v12a2 2 0 002 2h10a2 2 0 002-2V7" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 11v4m0 0l-2-2m2 2l2-2" />
          </svg>
          Archive
        </button>
        <button
          disabled
          class="w-full flex items-center gap-2.5 px-2 py-1.5 text-[13px] font-medium rounded-lg text-red-400/60 dark:text-red-500/50 cursor-not-allowed opacity-60 transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Delete
        </button>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
interface Project {
  id: string
  name: string | null
  pinnedAt: number | null
  createdAt: number
  updatedAt: number
}

const props = defineProps<{
  project: Project
  active: boolean
  pinned?: boolean
}>()

const emit = defineEmits<{
  select: []
  active: [value: boolean]
  pin: [pinned: boolean]
  archive: []
}>()

const { apiClient, API_ENDPOINTS } = useApi()

const isDropdownOpen = ref(false)
const isRenaming = ref(false)
const renameValue = ref('')
const renameInputRef = ref<HTMLInputElement | null>(null)
const dropdownPosition = ref<Record<string, string>>({})

const isActive = computed(() => isDropdownOpen.value || isRenaming.value)
watch(isActive, (val) => emit('active', val))

const toggleDropdown = (event: MouseEvent) => {
  if (isDropdownOpen.value) {
    isDropdownOpen.value = false
    return
  }
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  dropdownPosition.value = {
    top: `${rect.top}px`,
    left: `${rect.right + 6}px`,
  }
  isDropdownOpen.value = true
}

const startRename = () => {
  isDropdownOpen.value = false
  isRenaming.value = true
  renameValue.value = props.project.name ?? ''
  nextTick(() => {
    renameInputRef.value?.focus()
    renameInputRef.value?.select()
  })
}

const saveRename = async () => {
  if (!isRenaming.value) return
  const trimmed = renameValue.value.trim()
  const oldName = props.project.name
  if (trimmed === (oldName ?? '')) { cancelRename(); return }

  props.project.name = trimmed || null
  isRenaming.value = false

  try {
    await apiClient.patch(API_ENDPOINTS.projects.update(props.project.id), { name: trimmed || null })
  } catch (err) {
    console.error('Failed to rename project:', err)
    props.project.name = oldName
  }
}

const togglePin = () => {
  isDropdownOpen.value = false
  emit('pin', !props.pinned)
}

const archiveProject = () => {
  isDropdownOpen.value = false
  emit('archive')
}

const cancelRename = () => {
  isRenaming.value = false
  renameValue.value = ''
}

const handleClickOutside = () => {
  isDropdownOpen.value = false
}

onMounted(() => document.addEventListener('mousedown', handleClickOutside))
onUnmounted(() => document.removeEventListener('mousedown', handleClickOutside))
</script>

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
