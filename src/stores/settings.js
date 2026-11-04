import { defineStore } from 'pinia'
import { api } from '../services/api'

// Valores usados até a API responder (e se ela estiver fora do ar)
const DEFAULTS = { email: 'karolynneglow@gmail.com', phone: '558894045293', instagram: 'karolglow.oficial99', shipping: '' }

export const useSettingsStore = defineStore('settings', {
  state: () => ({ ...DEFAULTS, loaded: false }),
  getters: {
    instagramUrl: (s) => `https://www.instagram.com/${s.instagram}/`,
  },
  actions: {
    apply(data) {
      this.email = data.email || DEFAULTS.email
      this.phone = data.phone || DEFAULTS.phone
      this.instagram = data.instagram || DEFAULTS.instagram
      this.shipping = data.shipping || ''
    },
    // Site público
    async load() {
      try {
        this.apply(await api('/settings'))
      } catch {
        /* mantém os valores padrão */
      } finally {
        this.loaded = true
      }
    },
    // Painel
    async loadAdmin() {
      this.apply(await api('/admin/settings'))
      this.loaded = true
    },
    // Devolve o que o servidor guardou (já normalizado)
    async save(data) {
      const saved = await api('/admin/settings', { method: 'PUT', body: data })
      this.apply(saved)
      return saved
    },
  },
})
