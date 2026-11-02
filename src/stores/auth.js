import { defineStore } from 'pinia'
import {
  IDLE_TTL_MS,
  MAX_ATTEMPTS,
  SESSION_KEY,
  SESSION_TTL_MS,
  clearSession,
  getLockout,
  isConfigured,
  loadSession,
  newToken,
  registerFailure,
  resetFailures,
  saveSession,
  verifyCredentials,
} from '../services/auth'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    session: null, // { token, email, issuedAt, expiresAt, lastActivity }
    loading: false,
    expired: false, // a última verificação encontrou uma sessão vencida
    error: '',
    lockedUntil: 0,
    attemptsLeft: MAX_ATTEMPTS,
    configured: isConfigured,
  }),
  getters: {
    isAuthenticated: (state) => {
      const s = state.session
      if (!s) return false
      const now = Date.now()
      return s.expiresAt > now && now - s.lastActivity < IDLE_TTL_MS
    },
    email: (state) => state.session?.email || '',
  },
  actions: {
    // Lê a sessão salva e descarta se expirada
    restore() {
      const s = loadSession()
      if (s && s.token && s.expiresAt > Date.now() && Date.now() - s.lastActivity < IDLE_TTL_MS) this.session = s
      else {
        this.session = null
        if (s) clearSession()
      }
      const l = getLockout()
      this.lockedUntil = l.locked ? l.lockedUntil : 0
    },

    async login(email, password) {
      this.error = ''
      const lock = getLockout()
      if (lock.locked) {
        this.lockedUntil = lock.lockedUntil
        this.error = 'Muitas tentativas. Tente novamente mais tarde.'
        return false
      }
      if (!this.configured) {
        this.error = 'Acesso administrativo não configurado neste ambiente.'
        return false
      }
      this.loading = true
      try {
        const user = await verifyCredentials(email, password)
        if (!user) {
          const after = registerFailure()
          this.lockedUntil = after.locked ? after.lockedUntil : 0
          this.attemptsLeft = Math.max(0, MAX_ATTEMPTS - after.count)
          // mensagem genérica: não revela se o e-mail existe
          this.error = after.locked ? 'Muitas tentativas. Acesso bloqueado temporariamente.' : 'E-mail ou senha incorretos.'
          return false
        }
        resetFailures()
        this.expired = false
        this.attemptsLeft = MAX_ATTEMPTS
        const now = Date.now()
        this.session = { token: newToken(), email: user.email, issuedAt: now, expiresAt: now + SESSION_TTL_MS, lastActivity: now }
        saveSession(this.session)
        return true
      } finally {
        this.loading = false
      }
    },

    logout() {
      this.session = null
      clearSession()
    },

    // Renova a marca de atividade (limitado para não gravar a cada movimento)
    touch() {
      if (!this.session) return
      const now = Date.now()
      if (now - this.session.lastActivity < 15000) return
      this.session = { ...this.session, lastActivity: now }
      saveSession(this.session)
    },

    // Confere se a sessão ainda vale; se não, encerra. Retorna true se segue logado.
    check() {
      if (this.isAuthenticated) return true
      if (this.session) {
        this.logout()
        this.expired = true
      }
      return false
    },

    // Mantém abas sincronizadas (logout/login em outra aba)
    syncFromStorage() {
      this.restore()
    },
  },
})

export const SESSION_STORAGE_KEY = SESSION_KEY
