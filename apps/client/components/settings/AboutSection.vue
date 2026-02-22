<template>
  <div>
    <div class="flex items-center gap-4 mb-6">
      <img src="/logo.png" alt="Zentro AI" class="w-14 h-14 rounded-xl object-cover" />
      <div>
        <h4 class="text-lg font-bold text-foreground">Zentro AI</h4>
        <p class="text-sm text-foreground/50">Version 0.1.0</p>
      </div>
    </div>

    <p class="text-sm text-foreground/60 mb-6">Describe your idea in natural language, and watch as AI generates a fully functional website with live preview, in-browser code editor, and instant deployment.</p>

    <div class="space-y-3">
      <a
        href="https://github.com/decoded-cipher/zentro-ai"
        target="_blank"
        rel="noopener"
        class="flex items-center gap-3 px-4 py-3 rounded-lg border border-border hover:border-orange-300/50 dark:hover:border-orange-700/50 hover:bg-muted/40 transition-all duration-150 group"
      >
        <svg class="w-5 h-5 text-foreground/50 group-hover:text-foreground/70" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
        </svg>
        <div class="flex-1">
          <p class="text-sm font-medium text-foreground">GitHub</p>
          <p class="text-xs text-foreground/40">View source code and contribute</p>
        </div>
        <svg class="w-4 h-4 text-foreground/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
        </svg>
      </a>

      <a
        href="https://github.com/decoded-cipher/zentro-ai/issues"
        target="_blank"
        rel="noopener"
        class="flex items-center gap-3 px-4 py-3 rounded-lg border border-border hover:border-orange-300/50 dark:hover:border-orange-700/50 hover:bg-muted/40 transition-all duration-150 group"
      >
        <svg class="w-5 h-5 text-foreground/50 group-hover:text-foreground/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 12.75c1.148 0 2.278.08 3.383.237 1.037.146 1.866.966 1.866 2.013 0 3.728-2.35 6.75-5.25 6.75S6.75 18.728 6.75 15c0-1.046.83-1.867 1.866-2.013A24.204 24.204 0 0112 12.75zm0 0c2.883 0 5.647.508 8.207 1.44a23.91 23.91 0 01-1.152-6.135c-.22-2.058-1.794-3.555-3.805-3.555h-6.5c-2.011 0-3.585 1.497-3.805 3.555a23.908 23.908 0 01-1.152 6.135A24.066 24.066 0 0112 12.75zM2.695 18.408a49.108 49.108 0 01-.872-4.67A1.89 1.89 0 013.7 12h.158a1.878 1.878 0 001.863-1.61c.28-2.32.99-4.482 2.043-6.39H7.5a4.5 4.5 0 00-4.37 3.44A49.413 49.413 0 002.695 18.408z" />
        </svg>
        <div class="flex-1">
          <p class="text-sm font-medium text-foreground">Report an Issue</p>
          <p class="text-xs text-foreground/40">Found a bug? Let us know on GitHub</p>
        </div>
        <svg class="w-4 h-4 text-foreground/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
        </svg>
      </a>

      <a
        href="https://github.com/decoded-cipher/zentro-ai/blob/master/LICENSE"
        target="_blank"
        rel="noopener"
        class="flex items-center gap-3 px-4 py-3 rounded-lg border border-border hover:border-orange-300/50 dark:hover:border-orange-700/50 hover:bg-muted/40 transition-all duration-150 group"
      >
        <svg class="w-5 h-5 text-foreground/50 group-hover:text-foreground/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z" />
        </svg>
        <div class="flex-1">
          <p class="text-sm font-medium text-foreground">License</p>
          <p class="text-xs text-foreground/40">View project license</p>
        </div>
        <svg class="w-4 h-4 text-foreground/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
        </svg>
      </a>
    </div>

    <div class="mt-8 pt-4 border-t border-border">
      <p class="text-xs text-foreground/30 text-center">Built with Nuxt, Hono, and Drizzle ORM</p>
    </div>
  </div>
</template>

