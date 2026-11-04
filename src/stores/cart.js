import { defineStore } from 'pinia'

const KEY = 'kg_cart'
const MAX_QTY = 99

// Uma linha por produto + variação. `variation` guarda { label, price } do momento em que foi adicionada.
const keyOf = (productId, variationId) => `${productId}:${variationId ?? 0}`
const lineKey = (l) => keyOf(l.productId, l.variationId)

function read() {
  try {
    const data = JSON.parse(localStorage.getItem(KEY) || '[]')
    if (!Array.isArray(data)) return []
    return data
      .filter((l) => l && l.productId != null && Number.isInteger(l.qty) && l.qty > 0)
      .map((l) => ({
        productId: l.productId,
        variationId: l.variationId ?? null,
        variation: l.variation && typeof l.variation.label === 'string' && Number.isFinite(l.variation.price) ? { label: l.variation.label, price: l.variation.price } : null,
        qty: Math.min(l.qty, MAX_QTY),
      }))
  } catch {
    return []
  }
}

export const useCartStore = defineStore('cart', {
  state: () => ({ lines: read(), open: false }),
  getters: {
    count: (state) => state.lines.reduce((n, l) => n + l.qty, 0),
  },
  actions: {
    _save() {
      try {
        localStorage.setItem(KEY, JSON.stringify(this.lines))
      } catch {
        /* sem armazenamento: a sacola vale só nesta visita */
      }
    },
    // variation: { id, label, price } ou null
    add(productId, qty = 1, variation = null) {
      const variationId = variation?.id ?? null
      const line = this.lines.find((l) => lineKey(l) === keyOf(productId, variationId))
      if (line) line.qty = Math.min(line.qty + qty, MAX_QTY)
      else {
        this.lines.push({
          productId,
          variationId,
          variation: variation ? { label: variation.label, price: variation.price } : null,
          qty: Math.min(qty, MAX_QTY),
        })
      }
      this._save()
    },
    setQty(key, qty) {
      const line = this.lines.find((l) => lineKey(l) === key)
      if (!line) return
      if (qty < 1) return this.remove(key)
      line.qty = Math.min(qty, MAX_QTY)
      this._save()
    },
    remove(key) {
      this.lines = this.lines.filter((l) => lineKey(l) !== key)
      this._save()
    },
    clear() {
      this.lines = []
      this._save()
    },
    // Linhas prontas para exibir/enviar: só produtos que ainda existem e estão à venda
    resolve(products) {
      return this.lines
        .map((l) => {
          const p = products.byId(l.productId)
          if (!p || !p.active) return null
          return {
            key: lineKey(l),
            id: p.id,
            name: l.variation ? `${p.name} (${l.variation.label})` : p.name,
            price: l.variation ? l.variation.price : p.price,
            image: p.image,
            qty: l.qty,
          }
        })
        .filter(Boolean)
    },
    show() {
      this.open = true
    },
    hide() {
      this.open = false
    },
  },
})
