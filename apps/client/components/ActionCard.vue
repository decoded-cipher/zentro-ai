<template>
  <div
    :class="[
      'w-full max-w-full rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden',
      'bg-neutral-50 dark:bg-neutral-900/50 transition-all',
    ]"
  >

    <!-- Header -->
    <div
      :class="[
        'flex items-center justify-between gap-2 px-3 py-2 min-w-0',
        isCollapsible && 'cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800/50 transition-colors',
      ]"
      @click="isCollapsible && toggle()"
    >
      <div class="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
        <span class="text-xs text-neutral-500 dark:text-neutral-300">
          {{ label }}
        </span>
        <span v-if="filePath" class="font-mono text-[10px] text-neutral-400 dark:text-neutral-400 truncate">
          {{ filePath }}
        </span>
        <span v-else-if="title" class="text-xs text-neutral-500 dark:text-neutral-400 truncate">
          {{ title }}
        </span>
      </div>
  
      <!-- Expand/collapse icon -->
      <svg
        v-if="isCollapsible"
        :class="[
          'w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500 transition-transform duration-200 flex-shrink-0',
          isExpanded ? 'rotate-180' : '',
        ]"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </div>
    
    <!-- Content -->
    <div
      v-show="!isCollapsible || isExpanded"
      class="overflow-hidden transition-all duration-200 ease-in-out"
    >
      <div class="border-t border-neutral-200 dark:border-neutral-700 p-2">
        <div class="font-mono text-[10px] bg-neutral-100 dark:bg-neutral-800 rounded p-2 max-h-60 overflow-y-auto overflow-x-auto w-full">
          <pre class="whitespace-pre-wrap break-words min-w-0 w-full text-neutral-700 dark:text-neutral-300">{{ content }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>



<script setup lang="ts">
interface Props {
  label: string
  content: string
  filePath?: string
  title?: string
  isCollapsible?: boolean
  defaultExpanded?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isCollapsible: false,
  defaultExpanded: false,
})

const isExpanded = ref(props.defaultExpanded)

const toggle = () => {
  isExpanded.value = !isExpanded.value
}
</script>

