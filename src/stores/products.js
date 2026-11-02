import { defineStore } from 'pinia'

const names = [
  ['Sérum Iluminador', 'Rosto', 129.9, 'Novo'],
  ['Hidratante Facial', 'Rosto', 89.9, 'Mais vendido'],
  ['Gel de Limpeza', 'Rosto', 59.9, ''],
  ['Protetor Solar FPS 50', 'Rosto', 79.9, 'Mais vendido'],
  ['Óleo Corporal', 'Corpo', 74.9, ''],
  ['Esfoliante Corporal', 'Corpo', 64.9, 'Novo'],
  ['Loção Hidratante', 'Corpo', 54.9, ''],
  ['Máscara Capilar', 'Cabelo', 89.9, 'Mais vendido'],
  ['Shampoo Nutritivo', 'Cabelo', 49.9, ''],
  ['Máscara de Cílios', 'Maquiagem', 59.9, ''],
  ['Batom Cremoso', 'Maquiagem', 44.9, 'Novo'],
  ['Kit Cuidado Diário', 'Kits', 199.9, 'Mais vendido'],
]

export const useProductsStore = defineStore('products', {
  state: () => ({
    categories: ['Rosto', 'Corpo', 'Cabelo', 'Maquiagem', 'Kits'],
    brands: ['Marca 01', 'Marca 02', 'Marca 03', 'Marca 04', 'Marca 05'],
    skinTypes: ['Todos os tipos', 'Seca', 'Oleosa', 'Mista', 'Sensível'],
    variationTypes: ['Volume', 'Tamanho', 'Cor', 'Fragrância'],
    items: names.map(([name, category, price, tag], i) => ({
      id: i + 1,
      name,
      category,
      brand: `Marca 0${(i % 5) + 1}`,
      price,
      tag,
      image: '',
      stock: 10 + i * 3,
      active: i !== 8,
      featured: i % 3 === 0,
      promoPrice: i % 4 === 1 ? Math.round(price * 0.9 * 10) / 10 : null,
      bestSeller: tag === 'Mais vendido',
      volume: '30 ml',
      skinType: 'Todos os tipos',
      description: 'Fórmula leve, de rápida absorção, pensada para a rotina real e para realçar o seu brilho natural.',
    })),
    sales: [
      {
        id: 101,
        productId: 1,
        productName: 'Sérum Iluminador',
        category: 'Rosto',
        quantity: 2,
        total: 259.8,
        customer: 'Mariana Silva',
        date: '02/11/2026, 10:45',
      },
      {
        id: 102,
        productId: 2,
        productName: 'Hidratante Facial',
        category: 'Rosto',
        quantity: 1,
        total: 89.9,
        customer: 'Beatriz Costa',
        date: '02/11/2026, 09:30',
      },
      {
        id: 103,
        productId: 12,
        productName: 'Kit Cuidado Diário',
        category: 'Kits',
        quantity: 1,
        total: 199.9,
        customer: 'Camila Rocha',
        date: '01/11/2026, 17:15',
      },
      {
        id: 104,
        productId: 8,
        productName: 'Máscara Capilar',
        category: 'Cabelo',
        quantity: 2,
        total: 179.8,
        customer: 'Juliana Mendes',
        date: '01/11/2026, 14:20',
      },
    ],
  }),
  getters: {
    byId: (state) => (id) => state.items.find((p) => String(p.id) === String(id)),
    bestSellers: (state) => state.items.filter((p) => p.bestSeller).slice(0, 4),
    countByCategory: (state) => (c) => state.items.filter((p) => p.category === c).length,
    totalRevenue: (state) => state.sales.reduce((acc, s) => acc + (s.total || 0), 0),
    totalSalesCount: (state) => state.sales.reduce((acc, s) => acc + (s.quantity || 0), 0),
  },
  actions: {
    addProduct(product) {
      const nextId = this.items.length ? Math.max(...this.items.map((i) => Number(i.id) || 0)) + 1 : 1
      const newProduct = {
        id: nextId,
        name: product.name || 'Novo Produto',
        category: product.category || this.categories[0] || 'Rosto',
        brand: product.brand || this.brands[0] || 'Marca 01',
        price: Number(product.price) || 0,
        tag: product.tag || '',
        image: product.image || '',
        stock: Number(product.stock) || 0,
        active: product.active !== undefined ? product.active : true,
        featured: Boolean(product.featured),
        bestSeller: Boolean(product.bestSeller),
        volume: product.volume || '30 ml',
        skinType: product.skinType || 'Todos os tipos',
        description: product.description || '',
      }
      this.items.unshift(newProduct)
      return newProduct
    },
    updateProduct(id, updatedFields) {
      const index = this.items.findIndex((p) => String(p.id) === String(id))
      if (index !== -1) {
        this.items[index] = {
          ...this.items[index],
          ...updatedFields,
          price: updatedFields.price !== undefined ? Number(updatedFields.price) : this.items[index].price,
          stock: updatedFields.stock !== undefined ? Number(updatedFields.stock) : this.items[index].stock,
        }
        return this.items[index]
      }
      return null
    },
    deleteProduct(id) {
      const index = this.items.findIndex((p) => String(p.id) === String(id))
      if (index !== -1) {
        this.items.splice(index, 1)
        return true
      }
      return false
    },
    addCategory(category) {
      if (category && !this.categories.includes(category)) {
        this.categories.push(category)
      }
    },
    removeCategory(category) {
      this.categories = this.categories.filter((c) => c !== category)
    },
    addBrand(brand) {
      if (brand && !this.brands.includes(brand)) {
        this.brands.push(brand)
      }
    },
    removeBrand(brand) {
      this.brands = this.brands.filter((b) => b !== brand)
    },
    addSkinType(skinType) {
      if (skinType && !this.skinTypes.includes(skinType)) {
        this.skinTypes.push(skinType)
      }
    },
    removeSkinType(skinType) {
      this.skinTypes = this.skinTypes.filter((s) => s !== skinType)
    },
    addVariationType(type) {
      if (type && !this.variationTypes.includes(type)) {
        this.variationTypes.push(type)
      }
    },
    removeVariationType(type) {
      this.variationTypes = this.variationTypes.filter((v) => v !== type)
    },
    recordSale({ productId, quantity, customer }) {
      const product = this.byId(productId)
      if (!product) return null

      const qty = Math.max(1, Number(quantity) || 1)
      const total = product.price * qty

      // Decrease stock
      product.stock = Math.max(0, product.stock - qty)

      const nextId = this.sales.length ? Math.max(...this.sales.map((s) => Number(s.id) || 0)) + 1 : 1
      const now = new Date()
      const formattedDate = `${now.toLocaleDateString('pt-BR')}, ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`

      const sale = {
        id: nextId,
        productId: product.id,
        productName: product.name,
        category: product.category,
        quantity: qty,
        total,
        customer: customer || 'Cliente Balcão',
        date: formattedDate,
      }
      this.sales.unshift(sale)
      return sale
    },
  },
})
