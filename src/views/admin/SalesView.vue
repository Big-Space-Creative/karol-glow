<script setup>
import { ref, computed } from 'vue'
import { errorMessage } from '../../services/api'
import { useProductsStore } from '../../stores/products'
import AdminPageHeader from '../../components/admin/AdminPageHeader.vue'
import PillSelect from '../../components/admin/PillSelect.vue'

const store = useProductsStore()

const sku = (p) => `KG-${String(p.id).padStart(4, '0')}`
const brl = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

// Quantidades selecionadas por produto { [productId]: number }
const quantities = ref({})

// Filtros
const search = ref('')
const category = ref('')

const categoryOptions = computed(() => [
  { label: 'Todas', value: '' },
  ...store.categories.map((c) => ({ label: c, value: c })),
])

// Métricas superiores (calculadas pelo servidor)
const totalUnitsSoldToday = computed(() => store.stats.itemsToday)
const todayRevenue = computed(() => store.stats.revenueToday)
const bestSellerName = computed(() => store.stats.bestSellerMonth?.name || '—')
const unitPrice = (p) => p.promoPrice ?? p.price

// Lista de produtos filtrada
const filteredProducts = computed(() => {
  let list = store.items.filter((p) => p.active)
  const q = search.value.trim().toLowerCase()
  if (q) {
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        sku(p).toLowerCase().includes(q)
    )
  }
  if (category.value) {
    list = list.filter((p) => p.category === category.value)
  }
  return list
})

// Toast e Undo
const toast = ref({
  show: false,
  message: '',
  lastSaleId: null,
})

function showSaleToast(sale) {
  toast.value = {
    show: true,
    message: `Venda registrada: ${sale.quantity}x ${sale.productName}. Estoque atualizado.`,
    lastSaleId: sale.id,
  }
  setTimeout(() => {
    toast.value.show = false
  }, 4500)
}

function increment(productId, maxStock) {
  const current = quantities.value[productId] || 1
  if (current < maxStock) {
    quantities.value[productId] = current + 1
  }
}

function decrement(productId) {
  const current = quantities.value[productId] || 1
  if (current > 1) {
    quantities.value[productId] = current - 1
  }
}

async function handleRecordSale(product) {
  const qty = quantities.value[product.id] || 1
  if (product.stock < qty) {
    showMessage(`Estoque insuficiente! Disponível: ${product.stock} un.`)
    return
  }
  try {
    const sale = await store.recordSale({ productId: product.id, quantity: qty, customer: 'Balcão' })
    showSaleToast(sale)
    quantities.value[product.id] = 1
  } catch (err) {
    showMessage(errorMessage(err))
  }
}

function showMessage(message) {
  toast.value = { show: true, message, lastSaleId: null }
  setTimeout(() => (toast.value.show = false), 4500)
}

async function undoSale(sale) {
  try {
    await store.undoSale(sale.id)
    toast.value.show = false
  } catch (err) {
    showMessage(errorMessage(err))
  }
}

function undoLastSale() {
  const sale = store.sales.find((s) => s.id === toast.value.lastSaleId)
  if (sale) undoSale(sale)
}

const recentSales = computed(() => store.sales.slice(0, 5))
const timeOf = (iso) => new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
</script>

<template>
  <div class="bg-white min-h-full pb-20">
    <!-- AdminPageHeader oficial -->
    <AdminPageHeader
      eyebrow="Painel"
      title="Vendas"
      description="Escolha a quantidade e clique em &quot;Registrar venda&quot;. O estoque do produto é atualizado na hora."
    />

    <!-- 3 Métricas Superiores (como no Figma) -->
    <div class="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8 py-6 md:py-8 border-b border-line mb-8">
      <div>
        <p class="m-0 font-ui text-sm text-plum-muted">Itens vendidos hoje</p>
        <p class="m-0 font-display text-[28px] md:text-[56px] font-light leading-none text-plum mt-2">
          {{ totalUnitsSoldToday }}
        </p>
      </div>

      <div>
        <p class="m-0 font-ui text-sm text-plum-muted">Faturamento de hoje</p>
        <p class="m-0 font-display text-[28px] md:text-[56px] font-light leading-none text-plum mt-2">
          {{ brl(todayRevenue) }}
        </p>
      </div>

      <div class="hidden md:block">
        <p class="m-0 font-ui text-sm text-plum-muted">Mais vendido no mês</p>
        <p class="m-0 font-display text-[28px] md:text-[34px] font-light leading-tight text-plum mt-3 truncate">
          {{ bestSellerName }}
        </p>
      </div>
    </div>

    <!-- Layout Principal: 2 Colunas -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <!-- Coluna Esquerda: Lista de Produtos para Venda (8 cols) -->
      <div class="lg:col-span-8 bg-white border-2 border-lilac-soft rounded-3xl p-4 md:p-8 space-y-6">
        <!-- Filtros em Pill -->
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <!-- Campo de Busca em Pill -->
          <div class="relative flex-1">
            <svg
              class="w-4 h-4 text-plum-muted absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              v-model="search"
              type="text"
              placeholder="Buscar produto por nome ou SKU"
              class="w-full h-11 pl-11 pr-4 rounded-full border border-line bg-white font-ui text-sm text-plum placeholder:text-plum-muted focus:outline-none focus:border-plum"
            />
          </div>

          <!-- Select Categoria Pill -->
          <PillSelect
            v-model="category"
            label="Categoria:"
            :options="categoryOptions"
          />
        </div>

        <!-- Lista de Produtos -->
        <div class="divide-y divide-line">
          <div
            v-for="p in filteredProducts"
            :key="p.id"
            class="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <!-- Thumbnail + Info -->
            <div class="flex items-center gap-3.5 min-w-0 flex-1">
              <div class="w-12 h-12 rounded-xl border-[1.5px] border-dashed border-lilac bg-lilac-soft text-lilac flex items-center justify-center shrink-0 overflow-hidden">
                <img
                  v-if="p.image"
                  :src="p.image"
                  :alt="p.name"
                  class="w-full h-full object-cover"
                />
                <svg
                  v-else
                  class="w-6 h-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.6"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </div>

              <div class="min-w-0">
                <p class="font-ui text-base font-normal text-plum m-0 truncate">
                  {{ p.name }}
                </p>
                <p class="font-ui text-xs text-plum-muted m-0 mt-0.5">
                  SKU {{ sku(p) }} ·
                  <span :class="p.stock === 0 ? 'text-lilac font-medium' : ''">
                    {{ p.stock > 0 ? `${p.stock} em estoque` : 'Sem estoque' }}
                  </span>
                </p>
              </div>
            </div>

            <!-- Controles: Variação + Preço + Stepper + Botão -->
            <div class="flex flex-wrap items-center justify-between gap-3 sm:flex-nowrap sm:justify-end sm:gap-3.5 sm:shrink-0">
              <!-- Preço -->
              <span class="font-ui font-semibold text-base text-plum whitespace-nowrap min-w-[70px] text-right">
                {{ brl(unitPrice(p)) }}
              </span>

              <!-- Stepper Pill -->
              <div class="h-10 w-28 rounded-full border border-line bg-white flex items-center justify-between px-2 text-sm text-plum">
                <button
                  type="button"
                  class="w-6 h-6 flex items-center justify-center text-plum hover:text-lilac cursor-pointer border-none bg-transparent p-0 disabled:opacity-30 disabled:cursor-not-allowed"
                  :disabled="p.stock === 0 || (quantities[p.id] || 1) <= 1"
                  @click="decrement(p.id)"
                >
                  -
                </button>
                <span class="font-ui text-sm font-semibold select-none">
                  {{ quantities[p.id] || 1 }}
                </span>
                <button
                  type="button"
                  class="w-6 h-6 flex items-center justify-center text-plum hover:text-lilac cursor-pointer border-none bg-transparent p-0 disabled:opacity-30 disabled:cursor-not-allowed"
                  :disabled="p.stock === 0 || (quantities[p.id] || 1) >= p.stock"
                  @click="increment(p.id, p.stock)"
                >
                  +
                </button>
              </div>

              <!-- Botão Registrar venda -->
              <button
                v-if="p.stock > 0"
                type="button"
                class="h-11 w-full px-6 rounded-full bg-plum text-white font-ui text-xs font-semibold hover:bg-plum-muted cursor-pointer transition-colors whitespace-nowrap border-none sm:w-auto"
                @click="handleRecordSale(p)"
              >
                Registrar venda
              </button>
              <button
                v-else
                type="button"
                disabled
                class="h-11 w-full px-6 rounded-full bg-plum-muted/40 text-white font-ui text-xs font-semibold cursor-not-allowed whitespace-nowrap border-none sm:w-auto"
              >
                Registrar venda
              </button>
            </div>
          </div>

          <div v-if="filteredProducts.length === 0" class="py-12 text-center text-plum-muted font-ui text-sm">
            Nenhum produto encontrado.
          </div>
        </div>
      </div>

      <!-- Coluna Direita: Últimas Vendas (4 cols) -->
      <div class="lg:col-span-4 bg-white border-2 border-lilac-soft rounded-3xl p-8 sticky top-24 space-y-5">
        <div>
          <h2 class="font-display text-[28px] font-normal text-plum m-0">
            Últimas vendas
          </h2>
          <p class="font-ui text-xs text-plum-muted m-0 mt-1">Hoje</p>
        </div>

        <div class="divide-y divide-line">
          <div
            v-for="sale in recentSales"
            :key="sale.id"
            class="py-4 flex items-center justify-between gap-3 text-sm font-ui"
          >
            <div>
              <p class="m-0 font-medium text-plum">
                {{ sale.quantity }}x {{ sale.productName }}
              </p>
              <p class="m-0 font-ui text-xs text-plum-muted mt-0.5">
                {{ sale.variation ? sale.variation + ' · ' : '' }}{{ brl(sale.total) }} · {{ timeOf(sale.createdAt) }}
              </p>
            </div>

            <button
              type="button"
              class="font-ui text-xs font-medium text-plum underline hover:text-lilac cursor-pointer border-none bg-transparent p-0 whitespace-nowrap"
              @click="undoSale(sale)"
            >
              Desfazer
            </button>
          </div>

          <div v-if="recentSales.length === 0" class="py-8 text-center text-plum-muted text-xs">
            Nenhuma venda registrada hoje.
          </div>
        </div>

        <div>
          <p class="m-0 font-ui text-xs font-medium text-plum-muted">
            {{ store.sales.length }} venda(s) registrada(s) hoje.
          </p>
        </div>
      </div>
    </div>

    <!-- Floating Toast de Venda com botão Desfazer (como no Figma) -->
    <transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="transform translate-y-4 opacity-0"
      enter-to-class="transform translate-y-0 opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="transform translate-y-0 opacity-100"
      leave-to-class="transform translate-y-4 opacity-0"
    >
      <div
        v-if="toast.show"
        class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-[90vw] bg-plum text-white shadow-2xl rounded-full px-5 py-3 flex items-center gap-3 font-ui text-sm font-medium"
      >
        <div class="w-6 h-6 rounded-full bg-lilac/30 text-lilac flex items-center justify-center shrink-0">
          <svg
            class="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <span class="truncate">{{ toast.message }}</span>

        <button
          type="button"
          class="text-white underline font-semibold text-xs ml-2 cursor-pointer border-none bg-transparent hover:text-lilac-soft transition-colors whitespace-nowrap"
          @click="undoLastSale"
        >
          Desfazer
        </button>
      </div>
    </transition>
  </div>
</template>
