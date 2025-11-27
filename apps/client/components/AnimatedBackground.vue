<template>
  <div
    v-if="variant === 'blur'"
    :class="`absolute inset-0 overflow-hidden pointer-events-none opacity-30 ${className}`"
  >
    <div
      class="absolute top-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-float"
      :style="{ animationDelay: '0s' }"
    />
    <div
      class="absolute bottom-0 left-0 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl animate-float"
      :style="{ animationDelay: '3s' }"
    />
  </div>
  <div
    v-else-if="variant === 'dots'"
    :class="`absolute inset-0 bg-[linear-gradient(to_right,#80808020_1px,transparent_1px),linear-gradient(to_bottom,#80808020_1px,transparent_1px)] bg-[size:80px_80px] opacity-60 ${className}`"
  />
</template>

<script setup lang="ts">
interface Props {
  variant?: 'gradient' | 'dots' | 'blur'
  className?: string
}

withDefaults(defineProps<Props>(), {
  variant: 'blur',
  className: '',
})
</script>

