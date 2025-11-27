<template>
  <footer
    :class="`h-14 border-t border-neutral-200/80 dark:border-neutral-800/80 bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl py-4 px-6 ${className}`"
  >
    <div class="h-full flex items-center justify-center gap-3">
      <span class="text-xs text-neutral-500 dark:text-neutral-400">
        © Copyright {{ new Date().getFullYear() }}
      </span>
      <span class="mx-2 text-xs text-neutral-500 dark:text-neutral-400">|</span>
      <NuxtLink
        to="/"
        target="_blank"
        rel="noopener noreferrer"
        class="text-xs text-neutral-500 dark:text-neutral-400 hover:underline"
      >
        Zentro AI
      </NuxtLink>
      <span class="mx-2 text-xs text-neutral-500 dark:text-neutral-400">|</span>
      <span class="mx-2 text-xs text-neutral-500 dark:text-neutral-400">All rights reserved.</span>
    </div>
  </footer>
</template>

<script setup lang="ts">
interface Props {
  className?: string
}

withDefaults(defineProps<Props>(), {
  className: '',
})
</script>

