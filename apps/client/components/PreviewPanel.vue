<template>
  <div class="h-full w-full flex flex-col">
    <!-- Horizontal tabs at the top -->
    <div class="relative z-20 border-b border-neutral-200/80 dark:border-neutral-800/80 bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl">
      <div class="flex gap-1 px-6 pt-3 items-center justify-between">
        <div class="flex gap-1">
          <button
            v-for="tab in tabs"
            :key="tab.value"
            @click="$emit('tab-change', tab.value)"
            :class="[
              'group relative px-5 py-2.5 text-xs font-medium transition-all duration-200 flex items-center gap-2',
              activeTab === tab.value
                ? 'text-neutral-900 dark:text-white bg-gradient-to-r from-orange-500/10 via-red-500/10 to-rose-500/10 rounded-t-lg'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50 hover:rounded-t-lg',
            ]"
          >
            <span :class="['opacity-60', activeTab === tab.value && 'opacity-100 transition-opacity']">
              <component :is="tab.icon" />
            </span>
            <span>{{ tab.label }}</span>
            <div
              v-if="activeTab === tab.value"
              class="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 via-red-500 to-rose-500 rounded-full"
            />
          </button>
        </div>
        
        <!-- Device Preview Selector (only visible when preview tab is active) -->
        <div v-if="activeTab === 'preview'" ref="deviceSelectorRef" class="relative">
          <button
            @click="isDeviceDropdownOpen = !isDeviceDropdownOpen"
            class="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm border border-neutral-200/80 dark:border-neutral-700/80 rounded text-neutral-700 dark:text-neutral-300 hover:bg-white dark:hover:bg-neutral-800 hover:border-orange-300 dark:hover:border-orange-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500"
          >
            <component :is="deviceOptions.find(opt => opt.value === devicePreviewMode)?.icon" />
            <span>{{ getDeviceLabel(devicePreviewMode) }}</span>
            <svg
              class="w-3 h-3 transition-transform duration-200"
              :class="{ 'rotate-180': isDeviceDropdownOpen }"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          <!-- Dropdown Menu -->
          <Transition
            enter-active-class="transition duration-200 ease-out"
            enter-from-class="transform scale-95 opacity-0"
            enter-to-class="transform scale-100 opacity-100"
            leave-active-class="transition duration-150 ease-in"
            leave-from-class="transform scale-100 opacity-100"
            leave-to-class="transform scale-95 opacity-0"
          >
            <div
              v-if="isDeviceDropdownOpen"
              ref="dropdownRef"
              class="absolute right-0 top-full mt-2 z-[100] w-40 rounded border border-neutral-200/80 dark:border-neutral-700/80 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl shadow-xl p-1"
            >
              <button
                v-for="option in deviceOptions"
                :key="option.value"
                @click="handleDeviceChange(option.value)"
                :class="[
                  'w-full flex items-center gap-2.5 px-3 py-2 rounded text-xs font-medium transition-colors duration-150',
                  devicePreviewMode === option.value
                    ? 'bg-gradient-to-r from-orange-500/10 via-red-500/10 to-rose-500/10 text-neutral-900 dark:text-white'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50 hover:text-neutral-900 dark:hover:text-white',
                ]"
              >
                <component :is="option.icon" class="w-4 h-4" />
                <span>{{ option.label }}</span>
                <div
                  v-if="devicePreviewMode === option.value"
                  class="ml-auto w-1.5 h-1.5 rounded-full bg-gradient-to-r from-orange-500 via-red-500 to-rose-500"
                />
              </button>
            </div>
          </Transition>
        </div>
      </div>
    </div>

    <!-- Tab content -->
    <div class="flex-1 overflow-hidden relative">
      <!-- Code Editor Tab -->
      <div v-if="activeTab === 'code'" class="absolute inset-0 bg-[#1e1e1e] dark:bg-black">
        <IframePlaceholder
          :src="codeServerUrl"
          title="Code Editor"
          placeholder-title="Code Editor"
          :placeholder-description="isProjectReady ? 'VS Code Server' : 'Provisioning VS Code Server...'"
          :show-overlay="!isProjectReady"
        />
      </div>

      <!-- Preview Tab -->
      <div v-if="activeTab === 'preview'" class="absolute inset-0 bg-white dark:bg-neutral-950 m-2 border border-neutral-200/80 dark:border-neutral-800/80 rounded overflow-hidden">
        <!-- None Mode - Full Space -->
        <div
          v-if="devicePreviewMode === 'none'"
          class="h-full w-full"
        >
          <IframePlaceholder
            :src="previewSrc"
            title="Preview"
            placeholder-title="Live Preview"
            :placeholder-description="previewDescription"
            :show-overlay="showPreviewOverlay"
          >
            <template #icon>
              <svg
                class="w-12 h-12 text-neutral-300 dark:text-neutral-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.5"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.5"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            </template>
          </IframePlaceholder>
        </div>
        
        <!-- Device Preview Sizes -->
        <div
          v-else-if="devicePreviewMode !== 'scale-out'"
          ref="previewContainer"
          class="h-full w-full flex items-center justify-center bg-neutral-50 dark:bg-neutral-900 p-4"
        >
          <div
            ref="previewFrame"
            :class="[
              'bg-white dark:bg-neutral-950 shadow-2xl overflow-hidden transition-all duration-300',
            ]"
            :style="previewFrameStyle"
          >
            <IframePlaceholder
              :src="previewSrc"
              title="Preview"
              placeholder-title="Live Preview"
              :placeholder-description="previewDescription"
              :show-overlay="showPreviewOverlay"
            >
              <template #icon>
                <svg
                  class="w-12 h-12 text-neutral-300 dark:text-neutral-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="1.5"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="1.5"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              </template>
            </IframePlaceholder>
          </div>
        </div>
        
        <!-- Scale Out Mode -->
        <div v-else-if="devicePreviewMode === 'scale-out'" class="h-full w-full flex items-center justify-center">
          <div class="text-center space-y-4">
            <div class="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-orange-100 to-rose-100 dark:from-orange-900/20 dark:to-rose-900/20 flex items-center justify-center">
              <svg
                class="w-8 h-8 text-orange-500 dark:text-orange-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </div>
            <div>
              <p class="text-sm font-medium text-neutral-900 dark:text-white mb-2">Open in New Tab</p>
              <p class="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
                Click the button below to open the preview in a new browser tab
              </p>
              <button
                v-if="previewSrc"
                @click="openPreviewInNewTab"
                class="px-4 py-2 text-xs font-medium bg-gradient-to-r from-orange-500 via-red-500 to-rose-600 text-white rounded hover:opacity-90 transition-opacity shadow-lg hover:shadow-xl"
              >
                Open Preview
              </button>
              <p v-else class="text-xs text-neutral-400 dark:text-neutral-500">
                Preview URL not available
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  activeTab: string
  codeServerUrl: string
  previewSrc: string
  previewDescription: string
  showPreviewOverlay: boolean
  isProjectReady: boolean
  devicePreviewMode: 'none' | 'mobile' | 'tablet' | 'desktop' | 'scale-out'
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'tab-change': [tab: string]
  'device-preview-change': [mode: 'none' | 'mobile' | 'tablet' | 'desktop' | 'scale-out']
}>()

const isDeviceDropdownOpen = ref(false)
const previewContainer = ref<HTMLElement | null>(null)
const previewFrame = ref<HTMLElement | null>(null)
const dropdownRef = ref<HTMLElement | null>(null)
const deviceSelectorRef = ref<HTMLElement | null>(null)

const createIcon = (paths: string | string[]) => {
  const pathList = Array.isArray(paths) ? paths : [paths]
  return () => h('svg', { class: 'w-4 h-4', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, 
    pathList.map(d => h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d }))
  )
}

// Device options for dropdown with dimensions
const deviceOptions = [
  {
    value: 'none' as const,
    label: 'None',
    dimensions: null,
    icon: createIcon('M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4'),
  },
  {
    value: 'mobile' as const,
    label: 'Mobile',
    dimensions: { width: 375, height: 812 },
    icon: createIcon('M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z'),
  },
  {
    value: 'tablet' as const,
    label: 'Tablet',
    dimensions: { width: 768, height: 1024 },
    icon: createIcon('M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z'),
  },
  {
    value: 'desktop' as const,
    label: 'Desktop',
    dimensions: { width: 1920, height: 1080 }, // 16:9 aspect ratio
    icon: createIcon('M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'),
  },
  {
    value: 'scale-out' as const,
    label: 'Scale Out',
    dimensions: null,
    icon: createIcon('M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14'),
  },
]

const getDeviceLabel = (mode: 'none' | 'mobile' | 'tablet' | 'desktop' | 'scale-out') => {
  return deviceOptions.find(opt => opt.value === mode)?.label || mode
}

const handleDeviceChange = (mode: 'none' | 'mobile' | 'tablet' | 'desktop' | 'scale-out') => {
  emit('device-preview-change', mode)
  isDeviceDropdownOpen.value = false
}

// Calculate scaled dimensions to fit container
const previewFrameStyle = computed(() => {
  if (props.devicePreviewMode === 'scale-out' || props.devicePreviewMode === 'none') return {}
  
  const selectedDevice = deviceOptions.find(opt => opt.value === props.devicePreviewMode)
  const dims = selectedDevice?.dimensions
  
  if (!dims) return {}

  if (!previewContainer.value) {
    return {
      width: `${dims.width}px`,
      height: `${dims.height}px`,
    }
  }

  const container = previewContainer.value
  const containerWidth = container.clientWidth - 32 // Account for padding
  const containerHeight = container.clientHeight - 32

  const aspectRatio = dims.width / dims.height
  const containerAspectRatio = containerWidth / containerHeight

  let scaledWidth = dims.width
  let scaledHeight = dims.height

  if (containerAspectRatio > aspectRatio) {
    // Container is wider, scale based on height
    scaledHeight = Math.min(containerHeight, dims.height)
    scaledWidth = scaledHeight * aspectRatio
  } else {
    // Container is taller, scale based on width
    scaledWidth = Math.min(containerWidth, dims.width)
    scaledHeight = scaledWidth / aspectRatio
  }

  // Ensure it doesn't exceed container dimensions
  if (scaledWidth > containerWidth) {
    scaledWidth = containerWidth
    scaledHeight = scaledWidth / aspectRatio
  }
  if (scaledHeight > containerHeight) {
    scaledHeight = containerHeight
    scaledWidth = scaledHeight * aspectRatio
  }

  return {
    width: `${scaledWidth}px`,
    height: `${scaledHeight}px`,
  }
})

const tabs = [
  {
    value: 'code',
    label: 'Code Editor',
    icon: createIcon('M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4'),
  },
  {
    value: 'preview',
    label: 'Preview',
    icon: createIcon([
      'M15 12a3 3 0 11-6 0 3 3 0 016 0z',
      'M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
    ]),
  },
]

const openPreviewInNewTab = () => {
  if (props.previewSrc) {
    window.open(props.previewSrc, '_blank', 'noopener,noreferrer')
  }
}

// Handle click outside dropdown
onMounted(() => {
  let clickOutsideHandler: ((event: MouseEvent) => void) | null = null

  watch(isDeviceDropdownOpen, (open) => {
    if (open) {
      clickOutsideHandler = (event: MouseEvent) => {
        const target = event.target as HTMLElement
        if (deviceSelectorRef.value && !deviceSelectorRef.value.contains(target)) {
          isDeviceDropdownOpen.value = false
        }
      }
      nextTick(() => {
        document.addEventListener('mousedown', clickOutsideHandler!)
      })
    } else {
      if (clickOutsideHandler) {
        document.removeEventListener('mousedown', clickOutsideHandler)
        clickOutsideHandler = null
      }
    }
  })

  // Handle window resize for preview scaling
  const handleResize = () => {
    // Trigger recomputation of previewFrameStyle by accessing the computed
    if (previewContainer.value && props.devicePreviewMode !== 'scale-out') {
      // Force reactivity update
      nextTick(() => {})
    }
  }

  window.addEventListener('resize', handleResize)
  
  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
    if (clickOutsideHandler) {
      document.removeEventListener('mousedown', clickOutsideHandler)
    }
  })
})
</script>

