<template>
  <div>
    <NuxtPage />
  </div>
</template>

<script setup lang="ts">
const { theme } = useTheme()

watchEffect(() => {
  if (process.client) {
    const html = document.documentElement
    if (theme.value === 'dark') {
      html.classList.add('dark')
    } else {
      html.classList.remove('dark')
    }
  }
})

useHead({
  htmlAttrs: {
    lang: 'en',
  },
})
</script>

