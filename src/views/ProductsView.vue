<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useProductsStore } from '../stores/products'
import BaseChip from '../components/BaseChip.vue'
import Pagination from '../components/Pagination.vue'
import ProductCard from '../components/ProductCard.vue'
import ProductCardCompact from '../components/ProductCardCompact.vue'
import SearchField from '../components/SearchField.vue'
import SectionTitle from '../components/SectionTitle.vue'

const store = useProductsStore()
// 12 por página no desktop (3 colunas) e 6 no mobile (2 colunas), como no Figma
const mq = typeof window !== 'undefined' ? window.matchMedia('(max-width: 767px)') : null
const isMobile = ref(mq ? mq.matches : false)
const onMq = (e) => (isMobile.value = e.matches)
onMounted(() => mq?.addEventListener('change', onMq))
onBeforeUnmount(() => mq?.removeEventListener('change', onMq))
const perPage = computed(() => (isMobile.value ? 6 : 12))
const PRICE_MAX = 250

const category = ref('Todos')
const search = ref('')
const sort = ref('best')
const brands = ref([])
const skin = ref([])
const inStock = ref(false)
const onSale = ref(false)
const minPrice = ref(0)
const maxPrice = ref(PRICE_MAX)
const page = ref(1)
const filtersOpen = ref(false)
const showAllBrands = ref(false)

const active = computed(() => store.items.filter((p) => p.active))
const count = (fn) => active.value.filter(fn).length
const visibleBrands = computed(() => (showAllBrands.value ? store.brands : store.brands.slice(0, 5)))

const filtered = computed(() => {
  let list = active.value
  if (category.value !== 'Todos') list = list.filter((p) => p.category === category.value)
  if (search.value.trim()) list = list.filter((p) => p.name.toLowerCase().includes(search.value.trim().toLowerCase()))
  if (brands.value.length) list = list.filter((p) => brands.value.includes(p.brand))
  if (skin.value.length) list = list.filter((p) => skin.value.includes(p.skinType))
  if (inStock.value) list = list.filter((p) => p.stock > 0)
  if (onSale.value) list = list.filter((p) => p.promoPrice)
  list = list.filter((p) => p.price >= minPrice.value && p.price <= maxPrice.value)
  if (sort.value === 'low') list = [...list].sort((a, b) => a.price - b.price)
  else if (sort.value === 'high') list = [...list].sort((a, b) => b.price - a.price)
  else list = [...list].sort((a, b) => Number(b.bestSeller) - Number(a.bestSeller))
  return list
})
const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / perPage.value)))
const visible = computed(() => filtered.value.slice((page.value - 1) * perPage.value, page.value * perPage.value))

watch([category, search, sort, brands, skin, inStock, onSale, minPrice, maxPrice, perPage], () => (page.value = 1), { deep: true })

function onMin(e) {
  minPrice.value = Math.min(Number(e.target.value), maxPrice.value)
  e.target.value = minPrice.value
}
function onMax(e) {
  maxPrice.value = Math.max(Number(e.target.value), minPrice.value)
  e.target.value = maxPrice.value
}

function clearFilters() {
  brands.value = []
  skin.value = []
  inStock.value = false
  onSale.value = false
  minPrice.value = 0
  maxPrice.value = PRICE_MAX
}
</script>

<template>
  <div class="container">
    <!-- 01 · Topo -->
    <section class="flex flex-col gap-8 pt-6 md:pt-12">
      <nav class="flex items-center gap-2 text-sm" aria-label="Breadcrumb">
        <RouterLink to="/" class="text-plum-muted">Início</RouterLink>
        <span class="text-plum-muted">/</span>
        <span class="font-medium text-plum">Produtos</span>
      </nav>
      <div class="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <SectionTitle eyebrow="Catálogo" title="Todos os produtos" />
        <p class="m-0 font-ui text-base leading-normal text-plum-muted md:w-[460px] md:text-lg">
          Encontre o cuidado ideal para a sua rotina: rosto, corpo, cabelo e maquiagem em um só lugar.
        </p>
      </div>
    </section>

    <!-- 02 · Filtros -->
    <section class="mt-8 flex flex-col gap-4 border-b border-line pb-6 md:mt-14 md:flex-row md:items-center md:justify-between">
      <div class="order-2 -mx-4 flex gap-2 overflow-x-auto px-4 md:order-none md:mx-0 md:overflow-visible md:px-0">
        <BaseChip v-for="c in ['Todos', ...store.categories]" :key="c" :label="c" :active="category === c" @click="category = c" />
      </div>
      <div class="contents md:flex md:items-center md:gap-3">
        <SearchField v-model="search" class="order-1 md:order-none" />
        <div class="order-3 flex gap-3 md:order-none">
          <button
            type="button"
            class="inline-flex h-11 shrink-0 cursor-pointer items-center gap-2 rounded-full border border-plum bg-white px-5 font-ui text-[15px] font-medium text-plum md:hidden"
            @click="filtersOpen = true"
          >
            Filtros
            <svg class="size-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h2M10 17h10" /><circle cx="16" cy="7" r="2" /><circle cx="8" cy="17" r="2" /></svg>
          </button>
          <label class="flex h-11 min-w-0 flex-1 items-center gap-1.5 rounded-full border border-line bg-white pl-5 pr-3 md:flex-none">
            <span class="whitespace-nowrap font-ui text-sm text-plum-muted">Ordenar:</span>
            <select v-model="sort" class="min-w-0 flex-1 cursor-pointer appearance-none border-0 bg-transparent py-0 pr-1 font-ui text-sm font-medium text-plum outline-none">
              <option value="best">Mais vendidos</option>
              <option value="low">Menor preço</option>
              <option value="high">Maior preço</option>
            </select>
            <svg class="size-[18px] shrink-0 text-plum" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
          </label>
        </div>
      </div>
    </section>

    <!-- 03 · Conteúdo -->
    <section class="flex flex-col gap-8 pt-8 md:flex-row md:items-start">
      <div v-if="filtersOpen" class="fixed inset-0 z-40 bg-plum/70 md:hidden" aria-hidden="true" @click="filtersOpen = false" />
      <aside
        :class="[
          'flex flex-col gap-6 bg-white md:w-[300px] md:shrink-0 md:rounded-3xl md:px-6 md:py-7',
          filtersOpen ? 'fixed inset-x-0 bottom-0 z-50 max-h-[88vh] overflow-y-auto rounded-t-3xl px-6 pb-28 pt-6 shadow-2xl' : 'hidden md:flex',
        ]"
        aria-label="Filtros"
      >
        <div v-if="filtersOpen" class="mx-auto -mt-2 h-1 w-10 rounded-full bg-line md:hidden" />
        <div class="flex items-center justify-between">
          <h3 class="m-0 font-display text-[28px] font-normal leading-[1.2] tracking-[-0.01em]">Filtros</h3>
          <div class="flex items-center gap-4">
            <button type="button" class="cursor-pointer border-0 bg-transparent p-0 font-ui text-sm font-medium text-plum-muted underline" @click="clearFilters">Limpar tudo</button>
                      </div>
        </div>
        <div class="h-px w-full bg-line" />

        <!-- Preço -->
        <div class="flex flex-col gap-[18px]">
          <p class="m-0 font-ui text-[15px] font-semibold leading-[1.3]">Preço</p>
          <div class="price-range relative h-5">
            <div class="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-sm bg-line" />
            <div
              class="absolute top-1/2 h-1 -translate-y-1/2 rounded-sm bg-lilac"
              :style="{ left: `${(minPrice / PRICE_MAX) * 100}%`, right: `${100 - (maxPrice / PRICE_MAX) * 100}%` }"
            />
            <input type="range" min="0" :max="PRICE_MAX" :value="minPrice" aria-label="Preço mínimo" @input="onMin" />
            <input type="range" min="0" :max="PRICE_MAX" :value="maxPrice" aria-label="Preço máximo" @input="onMax" />
          </div>
          <div class="flex items-end gap-3">
            <label class="flex min-w-0 flex-1 flex-col gap-1.5 font-ui text-xs text-plum-muted">
              Mínimo
              <span class="flex h-11 items-center rounded-xl border border-line bg-white px-3.5 text-sm text-plum">R$ {{ minPrice }}</span>
            </label>
            <label class="flex min-w-0 flex-1 flex-col gap-1.5 font-ui text-xs text-plum-muted">
              Máximo
              <span class="flex h-11 items-center rounded-xl border border-line bg-white px-3.5 text-sm text-plum">R$ {{ maxPrice }}</span>
            </label>
          </div>
        </div>
        <div class="h-px w-full bg-line" />

        <!-- Marca -->
        <div class="flex flex-col gap-[18px]">
          <p class="m-0 font-ui text-[15px] font-semibold leading-[1.3]">Marca</p>
          <div class="flex flex-col gap-3.5">
            <label v-for="b in visibleBrands" :key="b" class="flex cursor-pointer items-center justify-between font-ui text-sm">
              <span class="flex items-center gap-3"><input v-model="brands" type="checkbox" :value="b" class="size-5 cursor-pointer accent-plum" />{{ b }}</span>
              <span class="text-xs text-plum-muted">({{ count((p) => p.brand === b) }})</span>
            </label>
          </div>
          <button v-if="store.brands.length > 5" type="button" class="w-fit cursor-pointer border-0 bg-transparent p-0 font-ui text-sm font-medium text-plum underline" @click="showAllBrands = !showAllBrands">
            {{ showAllBrands ? 'Ver menos marcas' : 'Ver mais marcas' }}
          </button>
        </div>
        <div class="h-px w-full bg-line" />

        <!-- Tipo de pele -->
        <div class="flex flex-col gap-[18px]">
          <p class="m-0 font-ui text-[15px] font-semibold leading-[1.3]">Tipo de pele</p>
          <div class="flex flex-col gap-3.5">
            <label v-for="s in store.skinTypes" :key="s" class="flex cursor-pointer items-center justify-between font-ui text-sm">
              <span class="flex items-center gap-3"><input v-model="skin" type="checkbox" :value="s" class="size-5 cursor-pointer accent-plum" />{{ s }}</span>
              <span class="text-xs text-plum-muted">({{ count((p) => p.skinType === s) }})</span>
            </label>
          </div>
        </div>
        <div class="h-px w-full bg-line" />

        <!-- Disponibilidade -->
        <div class="flex flex-col gap-[18px]">
          <p class="m-0 font-ui text-[15px] font-semibold leading-[1.3]">Disponibilidade</p>
          <div class="flex flex-col gap-3.5">
            <label class="flex cursor-pointer items-center justify-between font-ui text-sm">
              <span class="flex items-center gap-3"><input v-model="inStock" type="checkbox" class="size-5 cursor-pointer accent-plum" />Em estoque</span>
              <span class="text-xs text-plum-muted">({{ count((p) => p.stock > 0) }})</span>
            </label>
            <label class="flex cursor-pointer items-center justify-between font-ui text-sm">
              <span class="flex items-center gap-3"><input v-model="onSale" type="checkbox" class="size-5 cursor-pointer accent-plum" />Em promoção</span>
              <span class="text-xs text-plum-muted">({{ count((p) => p.promoPrice) }})</span>
            </label>
          </div>
        </div>

        <div v-if="filtersOpen" class="fixed inset-x-0 bottom-0 z-[60] flex gap-3 border-t border-line bg-white px-6 py-4 md:hidden">
          <button type="button" class="h-12 cursor-pointer rounded-full border border-plum bg-white px-8 font-ui text-base text-plum" @click="clearFilters">Limpar</button>
          <button type="button" class="h-12 flex-1 cursor-pointer rounded-full border-0 bg-plum font-ui text-base text-white" @click="filtersOpen = false">Ver {{ filtered.length }} produtos</button>
        </div>
      </aside>

      <div class="flex min-w-0 flex-1 flex-col gap-6">
        <p class="m-0 font-ui text-sm leading-normal text-plum-muted">Mostrando {{ visible.length }} de {{ filtered.length }} produtos</p>
        <div class="hidden flex-wrap gap-x-4 gap-y-8 md:flex">
          <ProductCard v-for="p in visible" :key="p.id" v-bind="p" />
        </div>
        <div class="grid grid-cols-2 gap-4 md:hidden">
          <ProductCardCompact v-for="p in visible" :key="p.id" v-bind="p" />
        </div>
        <p v-if="!visible.length" class="py-16 text-center font-ui text-plum-muted">Nenhum produto encontrado.</p>
        <div class="flex justify-center pt-10">
          <Pagination v-model:current-page="page" :total-pages="totalPages" />
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.price-range input[type='range'] {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 20px;
  margin: 0;
  background: transparent;
  pointer-events: none;
  appearance: none;
}
.price-range input[type='range']::-webkit-slider-thumb {
  pointer-events: auto;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 999px;
  background: white;
  border: 2px solid var(--color-lilac);
  cursor: pointer;
}
.price-range input[type='range']::-moz-range-thumb {
  pointer-events: auto;
  width: 16px;
  height: 16px;
  border-radius: 999px;
  background: white;
  border: 2px solid var(--color-lilac);
  cursor: pointer;
}
</style>
