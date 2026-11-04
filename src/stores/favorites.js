import { defineStore } from 'pinia'

const KEY = 'kg_favorites'

function read() {
  try {
    const data = JSON.parse(localStorage.getItem(KEY) || '[]')
    return Array.isArray(data) ? data.map(String).slice(0, 500) : []
  } catch {
    return []
  }
}

// Favoritos ficam só neste navegador (não exigem conta)
export const useFavoritesStore = defineStore('favorites', {
  state: () => ({ ids: read() }),
  getters: {
    has: (state) => (id) => state.ids.includes(String(id)),
  },
  actions: {
    toggle(id) {
      const key = String(id)
      this.ids = this.ids.includes(key) ? this.ids.filter((x) => x !== key) : [...this.ids, key]
      try {
        localStorage.setItem(KEY, JSON.stringify(this.ids))
      } catch {
        /* sem armazenamento: vale só nesta visita */
      }
    },
  },
})
