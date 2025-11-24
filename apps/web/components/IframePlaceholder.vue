<template>
  <div class="h-full w-full relative">
    <iframe
      :src="src"
      class="w-full h-full border-0 transition-opacity duration-300"
      :title="title"
      :sandbox="sandbox"
    />
    <div class="absolute inset-0 flex items-center justify-center bg-background/95 backdrop-blur-sm pointer-events-none">
      <div class="text-center space-y-2 pointer-events-auto animate-in fade-in-up">
        <div class="w-12 h-12 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center animate-pulse-glow">
          <slot name="icon">
            <svg
              class="w-6 h-6 text-foreground/60"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
              />
            </svg>
          </slot>
        </div>
        <p class="text-sm text-foreground/60 font-medium">
          {{ placeholderTitle }}
        </p>
        <p class="text-xs text-foreground/40">{{ placeholderDescription }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  src: string
  title: string
  placeholderTitle: string
  placeholderDescription: string
  sandbox?: string
}

withDefaults(defineProps<Props>(), {
  sandbox: 'allow-same-origin allow-scripts allow-popups allow-forms',
})
</script>

