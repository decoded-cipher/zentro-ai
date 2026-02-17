import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  // Site URL for canonical URLs
  site: 'https://zentro.arjunkrishna.dev',

  integrations: [tailwind()],

  adapter: cloudflare(),

  output: 'server',

  // Build optimizations
  build: {
    // Inline stylesheets smaller than this limit
    inlineStylesheets: 'auto',
  },
  
  // Compression and performance
  compressHTML: true,
  
  // Vite configuration for optimizations
  vite: {
    build: {
      // CSS code splitting
      cssCodeSplit: true,
      // Minify output
      minify: 'esbuild',
    },
    // Enable CSS minification
    css: {
      devSourcemap: true,
    },
  },
});
