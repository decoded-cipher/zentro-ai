<template>
  <div class="min-h-screen flex flex-col relative overflow-hidden bg-gradient-to-b from-white/50 via-white to-white/50 dark:from-neutral-900/50 dark:via-neutral-900 dark:to-neutral-900 space-between">
    <AnimatedBackground variant="dots" />

    <Sidebar />

    <PageHeader />

    <main class="flex flex-col items-center justify-center m-auto p-6 w-full flex-1 z-10">
      <div class="w-full max-w-4xl mx-auto space-y-8">
        <div class="flex justify-center">
          <div class="relative group">
            <div class="absolute inset-0 bg-orange-400/30 rounded-lg blur-lg group-hover:blur-xl transition-all duration-300" />
            <Badge
              variant="outline"
              class="relative inline-flex items-center gap-2 px-5 py-2.5 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm border border-orange-200/50 dark:border-orange-800/50 text-orange-700 dark:text-orange-300 hover:scale-105 hover:border-orange-300 dark:hover:border-orange-700 transition-all duration-300 shadow-md hover:shadow-lg"
            >
              <span class="text-lg">✨</span>
              <span>AI website builder</span>
            </Badge>
          </div>
        </div>

        <div
          class="text-center space-y-4 animate-in fade-in-up"
          :style="{ animationDelay: '0.2s' }"
        >
          <h1 class="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground leading-tight">
            Bring Your
            <span class="relative inline-block">
              <span class="relative z-10 bg-gradient-to-r from-orange-400 via-red-600 to-rose-600 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                Vision to Life
              </span>
              <span class="absolute inset-0 bg-orange-400/20 blur-2xl animate-pulse-glow" />
            </span>
            <br />
            <span class="animate-in fade-in-up" :style="{ animationDelay: '0.3s' }">
              with Just Words
            </span>
          </h1>
          <p
            class="text-lg md:text-xl text-foreground/70 max-w-2xl mx-auto font-normal animate-in fade-in-up"
            :style="{ animationDelay: '0.4s' }"
          >
            Create websites effortlessly by describing your ideas in natural language.
          </p>
        </div>

        <form @submit.prevent="handleSubmit" class="w-full animate-in fade-in-up">
          <div class="relative group">
            <div class="absolute -inset-1 bg-gradient-to-r from-orange-600 via-red-600 to-rose-600 rounded-2xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500 group-focus-within:opacity-30 animate-pulse-glow" />
            <div class="relative overflow-hidden rounded-2xl border-2 border-orange-200/60 dark:border-orange-800/60 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-sm shadow-lg transition-all duration-300 hover:shadow-2xl hover:scale-[1.01] focus-within:border-orange-400 dark:focus-within:border-orange-500 focus-within:shadow-orange-500/20">
              
              <div class="flex items-center gap-2 px-4 py-3 bg-neutral-50/80 dark:bg-neutral-800/40 border-b border-neutral-200/80 dark:border-neutral-700/80">
                <span class="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 shrink-0">Model</span>
                <ModelPicker
                  :model="selectedModel"
                  :disabled="isSubmitting"
                  @update:model="selectedModel = $event"
                />
              </div>
              
              <div :class="`flex gap-3 px-4 py-4 ${isMaxHeight ? 'items-end' : 'items-center'}`">
                <textarea
                  ref="textareaRef"
                  v-model="prompt"
                  @keydown="handleKeyDown"
                  placeholder="What would you like to build?"
                  :disabled="isSubmitting"
                  rows="1"
                  class="flex-1 bg-transparent border-none outline-none text-base text-foreground placeholder:text-foreground/50 focus:ring-0 focus:border-none resize-none overflow-hidden min-h-[24px] leading-6"
                  :style="{ height: textareaHeight }"
                />
                <Button
                  type="submit"
                  :disabled="!prompt.trim() || isSubmitting"
                  variant="gradient"
                  size="md"
                  class="relative overflow-hidden group flex-shrink-0 rounded-full p-3"
                >
                  <template v-if="prompt.trim() && !isSubmitting">
                    <span class="absolute inset-0 bg-gradient-to-r from-orange-400 via-red-400 to-rose-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-shimmer" />
                    <span class="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  </template>
                  <span class="relative z-10 font-semibold hidden sm:inline">Generate</span>
                  <svg
                    class="w-4 h-4 relative group-hover:translate-x-1 transition-transform duration-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </Button>
              </div>

            </div>
          </div>
        </form>
      </div>
    </main>

    <PageFooter />
  </div>
</template>

<script setup lang="ts">
const router = useRouter()
const { apiClient, API_ENDPOINTS } = useApi()
const { defaultModelId } = useModels()
const projectsStore = useProjectsStore()
const preferencesStore = usePreferencesStore()

const prompt = ref('')
const selectedModel = computed({
  get: () => preferencesStore.lastSelectedModelId ?? defaultModelId.value ?? '',
  set: (v) => preferencesStore.setLastSelectedModel(v || null),
})
const isSubmitting = ref(false)
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const isMaxHeight = ref(false)
const textareaHeight = ref('24px')

// Auto-resize textarea
watch(prompt, () => {
  nextTick(() => {
    const textarea = textareaRef.value
    if (!textarea) return

    textarea.style.height = 'auto'
    const lineHeight = parseInt(getComputedStyle(textarea).lineHeight) || 24
    const maxHeight = lineHeight * 3

    if (textarea.scrollHeight <= maxHeight) {
      textarea.style.height = `${textarea.scrollHeight}px`
      textarea.style.overflowY = 'hidden'
      isMaxHeight.value = false
      textareaHeight.value = `${textarea.scrollHeight}px`
    } else {
      textarea.style.height = `${maxHeight}px`
      textarea.style.overflowY = 'auto'
      isMaxHeight.value = true
      textareaHeight.value = `${maxHeight}px`
    }
  })
})

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    if (prompt.value.trim() && !isSubmitting.value) {
      handleSubmit(e as any)
    }
  }
}

const handleSubmit = async (e: Event) => {
  e.preventDefault()
  if (!prompt.value.trim() || isSubmitting.value) return

  isSubmitting.value = true

  try {
    const response = await apiClient.post(API_ENDPOINTS.projects.create, {
      prompt: prompt.value.trim(),
      model: selectedModel.value || defaultModelId.value,
    })

    const projectId = response.data.id
    const now = Math.floor(Date.now() / 1000)
    projectsStore.addProject({
      id: projectId,
      name: null,
      pinnedAt: null,
      createdAt: now,
      updatedAt: now,
    })
    preferencesStore.setLastSelectedModel(selectedModel.value || null)

    router.push(`/chat/${projectId}`)
  } catch (error: any) {
    console.error('Error creating project:', error)
    isSubmitting.value = false
  }
}
</script>

