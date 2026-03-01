<template>
  <span
    class="inline-flex shrink-0 items-center justify-center overflow-hidden text-foreground"
    :class="sizeClass"
    aria-hidden
  >
    <span
      v-if="iconSvg"
      class="contents [&>svg]:h-full [&>svg]:w-full"
      v-html="iconSvg"
    />
    <span v-else class="flex h-full w-full items-center justify-center rounded bg-muted text-[10px] font-bold uppercase text-muted-foreground">
      {{ providerId?.charAt(0) ?? '?' }}
    </span>
  </span>
</template>

<script setup lang="ts">
import openaiSvg from '@lobehub/icons-static-svg/icons/openai.svg?raw'
import anthropicSvg from '@lobehub/icons-static-svg/icons/anthropic.svg?raw'
import googleSvg from '@lobehub/icons-static-svg/icons/google.svg?raw'
import metaSvg from '@lobehub/icons-static-svg/icons/meta.svg?raw'
import ollamaSvg from '@lobehub/icons-static-svg/icons/ollama.svg?raw'
import mistralSvg from '@lobehub/icons-static-svg/icons/mistral.svg?raw'
import deepseekSvg from '@lobehub/icons-static-svg/icons/deepseek.svg?raw'
import xaiSvg from '@lobehub/icons-static-svg/icons/xai.svg?raw'
import cohereSvg from '@lobehub/icons-static-svg/icons/cohere.svg?raw'
import perplexitySvg from '@lobehub/icons-static-svg/icons/perplexity.svg?raw'
import togetherSvg from '@lobehub/icons-static-svg/icons/together.svg?raw'
import groqSvg from '@lobehub/icons-static-svg/icons/groq.svg?raw'
import fireworksSvg from '@lobehub/icons-static-svg/icons/fireworks.svg?raw'
import openrouterSvg from '@lobehub/icons-static-svg/icons/openrouter.svg?raw'

const ICONS: Record<string, string> = {
  openai: openaiSvg,
  anthropic: anthropicSvg,
  google: googleSvg,
  meta: metaSvg,
  local: ollamaSvg,
  mistral: mistralSvg,
  deepseek: deepseekSvg,
  xai: xaiSvg,
  cohere: cohereSvg,
  perplexity: perplexitySvg,
  together: togetherSvg,
  groq: groqSvg,
  fireworks: fireworksSvg,
  openrouter: openrouterSvg,
}

const props = withDefaults(
  defineProps<{
    providerId: string
    size?: 'xs' | 'sm' | 'md'
  }>(),
  { size: 'sm' }
)

const iconSvg = computed(() => ICONS[props.providerId] ?? null)

const sizeClass = computed(() => {
  switch (props.size) {
    case 'xs': return 'h-3.5 w-3.5'
    case 'md': return 'h-5 w-5'
    default: return 'h-4 w-4'
  }
})
</script>
