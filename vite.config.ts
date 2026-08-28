import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Relative base + hash routing (see src/router) so the built `dist/` can be
// dropped onto any static host or sub-path without rewrite rules.
export default defineConfig({
  base: './',
  plugins: [vue()],
})
