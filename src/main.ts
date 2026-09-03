import { createApp } from 'vue'
// Self-hosted fonts (latin subset) — no external requests, works offline.
import '@fontsource/inter/latin-400.css'
import '@fontsource/inter/latin-500.css'
import '@fontsource/inter/latin-600.css'
import '@fontsource/jetbrains-mono/latin-400.css'
import '@fontsource/jetbrains-mono/latin-500.css'
import { registerSW } from 'virtual:pwa-register'
import './style.css'
import App from './App.vue'
import router from './router'

// Precache the whole app so it keeps working offline; new deploys take over
// automatically on the next visit.
registerSW({ immediate: true })

const app = createApp(App)
app.use(router)
app.mount('#app')
