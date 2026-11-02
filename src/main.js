import { createApp } from 'vue'
import { createPinia } from 'pinia'
import '@fontsource-variable/fraunces'
import '@fontsource-variable/plus-jakarta-sans'
import './style.css'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'
import { SESSION_KEY } from './services/auth'

const app = createApp(App).use(createPinia())

// Restaura a sessão ANTES de o router resolver a primeira rota
const auth = useAuthStore()
auth.restore()

app.use(router)

// Encerra a sessão por inatividade/expiração e reage a logout em outras abas
function leaveAdmin(reason) {
  if (router.currentRoute.value.matched.some((r) => r.meta.requiresAuth)) {
    router.replace({ name: 'login', query: { reason } })
  }
}
setInterval(() => {
  if (auth.session && !auth.isAuthenticated) {
    auth.logout()
    leaveAdmin('expired')
  }
}, 30000)
;['click', 'keydown', 'pointerdown', 'scroll'].forEach((evt) =>
  window.addEventListener(evt, () => auth.touch(), { passive: true }),
)
window.addEventListener('storage', (e) => {
  if (e.key !== SESSION_KEY) return
  auth.syncFromStorage()
  if (!auth.isAuthenticated) leaveAdmin('logout')
})

app.mount('#app')
