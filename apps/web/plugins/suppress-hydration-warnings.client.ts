export default defineNuxtPlugin(() => {
  if (process.client) {
    // Suppress Vue hydration warnings
    const originalWarn = console.warn
    console.warn = (...args: any[]) => {
      if (
        typeof args[0] === 'string' &&
        (args[0].includes('Hydration') || args[0].includes('mismatch'))
      ) {
        return
      }
      originalWarn.apply(console, args)
    }
  }
})

