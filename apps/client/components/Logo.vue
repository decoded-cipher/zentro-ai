<template>
  <NuxtLink v-if="props.to" :to="props.to" :class="containerClass" class="cursor-pointer">
    <ClientOnly>
      <img :src="logoSrc" alt="Zentro AI Logo" class="h-full w-full object-contain object-left" />
      <template #fallback>
        <img src="/logo-black.png" alt="Zentro AI Logo" class="h-full w-full object-contain object-left" />
      </template>
    </ClientOnly>
  </NuxtLink>
  <div v-else :class="containerClass">
    <ClientOnly>
      <img :src="logoSrc" alt="Zentro AI Logo" class="h-full w-full object-contain object-left" />
      <template #fallback>
        <img src="/logo-black.png" alt="Zentro AI Logo" class="h-full w-full object-contain object-left" />
      </template>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { useTheme } from '~/composables/useTheme'

interface Props {
  className?: string
  to?: string
}

const props = withDefaults(defineProps<Props>(), {
  className: '',
  to: '/',
})

const { theme } = useTheme()

const containerClass = computed(() => `h-9 w-auto min-w-[100px] flex-shrink-0 ${props.className}`)

const logoSrc = computed(() => {
  const isDark = theme.value === 'dark' || 
    (theme.value === 'system' && process.client && window.matchMedia('(prefers-color-scheme: dark)').matches)
  return isDark ? '/logo-white.png' : '/logo-black.png'
})
</script>

