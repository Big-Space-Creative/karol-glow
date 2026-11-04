import { defineStore } from 'pinia'
import { ApiError, api, setUnauthorizedHandler } from '../services/api'

// Só aceita caminhos internos do admin (evita open redirect)
export function safeRedirect(path) {
  if (typeof path !== 'string') return '/admin'
  if (!path.startsWith('/admin') || path.startsWith('//') || path.includes('://') || path.includes('\\')) return '/admin'
  return path
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null, // { id, email, name } — vem do servidor (cookie de sessão HttpOnly)
    checked: false, // já perguntamos ao servidor se há sessão?
    loading: false,
    expired: false, // a sessão acabou durante o uso
    error: '',
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.user),
    email: (state) => state.user?.email || '',
  },
  actions: {
    // Pergunta ao servidor quem está logado (uma vez; depois usa o resultado em memória)
    async fetchMe(force = false) {
      if (this.checked && !force) return this.isAuthenticated
      try {
        const { user } = await api('/auth/me', { silent401: true })
        this.user = user
      } catch (err) {
        this.user = null
        if (!(err instanceof ApiError) || err.status !== 401) this.error = ''
      }
      this.checked = true
      return this.isAuthenticated
    },

    async login(email, password) {
      this.error = ''
      this.loading = true
      try {
        const { user } = await api('/auth/login', { method: 'POST', body: { email, password }, silent401: true })
        this.user = user
        this.checked = true
        this.expired = false
        return true
      } catch (err) {
        this.error = err instanceof ApiError ? err.message : 'Não foi possível entrar. Tente novamente.'
        return false
      } finally {
        this.loading = false
      }
    },

    async logout() {
      try {
        await api('/auth/logout', { method: 'POST', silent401: true })
      } catch {
        /* a sessão local é descartada de qualquer forma */
      }
      this.user = null
    },

    // A API respondeu 401 no meio do uso: a sessão venceu ou foi revogada
    handleUnauthorized() {
      if (!this.user) return
      this.user = null
      this.expired = true
    },
  },
})

// Registra o tratamento de 401 sem criar dependência circular com o cliente HTTP
export function bindUnauthorized(router) {
  const auth = useAuthStore()
  setUnauthorizedHandler(() => {
    auth.handleUnauthorized()
    if (router.currentRoute.value.matched.some((r) => r.meta.requiresAuth)) {
      router.replace({ name: 'login', query: { reason: 'expired' } })
    }
  })
}
