import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

// Relative base + hash routing (see src/router) so the built `dist/` can be
// dropped onto any static host or sub-path without rewrite rules.
export default defineConfig({
  base: './',
  plugins: [
    vue(),
    // Offline support: precache every build asset (fonts included). The
    // manifest stays the hand-written public/site.webmanifest.
    VitePWA({
      registerType: 'autoUpdate',
      manifest: false,
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2,webmanifest}'],
        // Social-preview image is never needed inside the app.
        globIgnores: ['og.png'],
        navigateFallback: 'index.html',
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      },
    }),
  ],
})
