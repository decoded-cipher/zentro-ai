<template>
  <header
    :class="`relative z-30 h-14 border-b border-neutral-200/80 dark:border-neutral-800/80 bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl ${className}`"
  >
    <div class="h-full px-6 flex items-center justify-between">
      <Logo to="/" />

      <div class="flex items-center gap-3">
        <ThemeToggle />
        <ClientOnly>
          <SignedOut>
            <SignInButton mode="modal">
              <Button
                variant="outline"
                size="sm"
                class="h-9 px-4 text-sm"
              >
                Log In
              </Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button
                variant="gradient"
                size="sm"
                class="h-9 px-4 text-sm"
              >
                Sign Up
              </Button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </ClientOnly>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
interface Props {
  className?: string
}

withDefaults(defineProps<Props>(), {
  className: '',
})
</script>

