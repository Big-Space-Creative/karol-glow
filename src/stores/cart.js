import { defineStore } from 'pinia'

export const useCartStore = defineStore('cart', {
  state: () => ({ lines: [] }),
  getters: {
    count: (state) => state.lines.reduce((n, l) => n + l.qty, 0),
  },
  actions: {
    add(productId, qty = 1) {
      const line = this.lines.find((l) => l.productId === productId)
      if (line) line.qty += qty
      else this.lines.push({ productId, qty })
    },
  },
})
