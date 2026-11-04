import { defineStore } from 'pinia'
import { api, errorMessage } from '../services/api'

// Lê todas as páginas de uma listagem (a API limita 100 itens por página)
async function fetchAll(path, query = {}) {
  const items = []
  let page = 1
  for (;;) {
    const res = await api(path, { query: { ...query, page, perPage: 100 } })
    items.push(...res.items)
    if (items.length >= res.total || res.items.length === 0) return items
    page++
  }
}

// API -> formato usado pelas telas
const normalize = (p) => ({
  ...p,
  skinType: (p.skinTypes || []).join(', '),
  variations: p.variations || [],
})

const KINDS = {
  categories: { path: 'categories', list: 'categories' },
  brands: { path: 'brands', list: 'brands' },
  skinTypes: { path: 'skin-types', list: 'skinTypes' },
  variationTypes: { path: 'variation-types', list: 'variationTypes' },
}

export const useProductsStore = defineStore('products', {
  state: () => ({
    // Listas do catálogo com id e contagem (vindas de /api/catalog)
    catalog: { categories: [], brands: [], skinTypes: [], variationTypes: [] },
    items: [],
    sales: [], // vendas de hoje (admin)
    stats: { itemsToday: 0, revenueToday: 0, salesToday: 0, bestSellerMonth: null },
    loaded: false,
    loading: false,
    error: '',
  }),
  getters: {
    // Nomes, na ordem do servidor (as telas usam listas de texto)
    categories: (state) => state.catalog.categories.map((c) => c.name),
    brands: (state) => state.catalog.brands.map((b) => b.name),
    skinTypes: (state) => state.catalog.skinTypes.map((s) => s.name),
    variationTypes: (state) => state.catalog.variationTypes.map((v) => v.name),
    byId: (state) => (id) => state.items.find((p) => String(p.id) === String(id)),
    bestSellers: (state) => state.items.filter((p) => p.active && p.bestSeller).slice(0, 4),
    countByCategory: (state) => (name) => state.items.filter((p) => p.category === name).length,
  },
  actions: {
    async loadCatalog() {
      this.catalog = await api('/catalog')
    },

    // Site público: só produtos ativos
    async loadPublic() {
      this.loading = true
      this.loaded = false
      this.error = ''
      try {
        const [, items] = await Promise.all([this.loadCatalog(), fetchAll('/products')])
        this.items = items.map(normalize)
        this.loaded = true
      } catch (err) {
        this.error = errorMessage(err)
      } finally {
        this.loading = false
      }
    },

    // Painel: todos os produtos (inclusive inativos) + vendas de hoje
    async loadAdmin() {
      this.loading = true
      this.loaded = false
      this.error = ''
      try {
        const [, items, sales, stats] = await Promise.all([
          this.loadCatalog(),
          fetchAll('/admin/products'),
          api('/admin/sales', { query: { date: 'today', perPage: 100 } }),
          api('/admin/sales/stats'),
        ])
        this.items = items.map(normalize)
        this.sales = sales.items
        this.stats = stats
        this.loaded = true
      } catch (err) {
        this.error = errorMessage(err)
      } finally {
        this.loading = false
      }
    },

    // Produto completo (com variações) para a tela de edição
    async fetchAdminProduct(id) {
      return normalize(await api(`/admin/products/${id}`))
    },

    _idOf(kind, name) {
      return this.catalog[kind].find((x) => x.name === name)?.id
    },

    // data: formato das telas (nomes em vez de ids). Lança ApiError se o servidor recusar.
    _payload(data) {
      const skinNames = Array.isArray(data.skinTypes) ? data.skinTypes : []
      return {
        name: data.name,
        description: data.description || '',
        usage: data.usage || '',
        ingredients: data.ingredients || '',
        categoryId: this._idOf('categories', data.category),
        brandId: this._idOf('brands', data.brand) ?? null,
        price: Number(data.price) || 0,
        promoPrice: data.promoPrice ? Number(data.promoPrice) : null,
        stock: Number(data.stock) || 0,
        volume: data.volume || null,
        tag: data.tag || null,
        active: Boolean(data.active),
        featured: Boolean(data.featured),
        bestSeller: Boolean(data.bestSeller),
        skinTypeIds: skinNames.map((n) => this._idOf('skinTypes', n)).filter(Boolean),
        images: data.image ? [data.image] : [],
        variations: (data.variations || []).map((v) => ({
          typeId: this._idOf('variationTypes', v.type),
          label: v.label,
          sku: v.sku || undefined,
          price: Number(v.price) || 0,
          stock: Number(v.stock) || 0,
        })),
      }
    },

    _upsertLocal(product) {
      const i = this.items.findIndex((p) => p.id === product.id)
      if (i === -1) this.items.unshift(product)
      else this.items[i] = product
    },

    async addProduct(data) {
      const created = normalize(await api('/admin/products', { method: 'POST', body: this._payload(data) }))
      this._upsertLocal(created)
      return created
    },

    async updateProduct(id, data) {
      const updated = normalize(await api(`/admin/products/${id}`, { method: 'PUT', body: this._payload(data) }))
      this._upsertLocal(updated)
      return updated
    },

    async deleteProduct(id) {
      await api(`/admin/products/${id}`, { method: 'DELETE' })
      this.items = this.items.filter((p) => String(p.id) !== String(id))
    },

    // ---- Catálogo (categorias, marcas, tipos de pele e de variação) ----
    async addCatalogItem(kind, name) {
      const { path, list } = KINDS[kind]
      const created = await api(`/admin/catalog/${path}`, { method: 'POST', body: { name } })
      this.catalog[list].push({ ...created, productCount: 0 })
      return created
    },

    async removeCatalogItem(kind, name) {
      const { path, list } = KINDS[kind]
      const item = this.catalog[list].find((x) => x.name === name)
      if (!item) return
      await api(`/admin/catalog/${path}/${item.id}`, { method: 'DELETE' })
      this.catalog[list] = this.catalog[list].filter((x) => x.id !== item.id)
    },

    // ---- Vendas ----
    async recordSale({ productId, variationId, quantity, customer }) {
      const sale = await api('/admin/sales', {
        method: 'POST',
        body: { productId, variationId: variationId ?? null, quantity, customer },
      })
      this.sales.unshift(sale)
      await this._refreshProduct(productId)
      await this._refreshStats()
      return sale
    },

    async undoSale(id) {
      const sale = await api(`/admin/sales/${id}/undo`, { method: 'POST' })
      this.sales = this.sales.filter((s) => s.id !== id)
      await this._refreshProduct(sale.productId)
      await this._refreshStats()
      return sale
    },

    async _refreshProduct(id) {
      this._upsertLocal(normalize(await api(`/admin/products/${id}`)))
    },
    async _refreshStats() {
      this.stats = await api('/admin/sales/stats')
    },
  },
})
