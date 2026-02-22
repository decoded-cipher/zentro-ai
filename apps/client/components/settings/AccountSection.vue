<template>
  <div>
    <p class="text-sm text-foreground/60 mb-4">Manage your account, profile, and authentication settings.</p>
    <ClientOnly>
      <SignedIn>
        <div class="flex items-center gap-4 p-4 rounded-lg border border-border bg-muted/30 mb-6">
          <UserButton />
          <div>
            <p class="text-sm font-medium text-foreground">Signed in</p>
            <p class="text-xs text-foreground/50 mt-0.5">Click your avatar to manage your profile, email, and security settings</p>
          </div>
        </div>
        <div class="space-y-3">
          <div class="p-4 rounded-lg border border-border">
            <h4 class="text-sm font-medium text-foreground mb-1">Profile & Security</h4>
            <p class="text-xs text-foreground/50">Update your name, email, password, and two-factor authentication from your profile avatar above.</p>
          </div>
          <div class="p-4 rounded-lg border border-border">
            <h4 class="text-sm font-medium text-foreground mb-1">Connected Accounts</h4>
            <p class="text-xs text-foreground/50">Manage your connected social accounts and sign-in methods via your profile above.</p>
          </div>
        </div>
      </SignedIn>
      <SignedOut>
        <div class="flex flex-col items-center justify-center py-16 text-center">
          <div class="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mb-3">
            <svg class="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
          <p class="text-sm font-medium text-foreground/70">Not signed in</p>
          <p class="text-xs text-foreground/40 mt-1">Sign in to manage your account settings</p>
        </div>
      </SignedOut>
    </ClientOnly>
  </div>
</template>
