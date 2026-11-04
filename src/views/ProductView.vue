<script setup>
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { api } from '../services/api'
import { useCartStore } from '../stores/cart'
import { useSettingsStore } from '../stores/settings'
import { useFavoritesStore } from '../stores/favorites'
import { useProductsStore } from '../stores/products'
import AccordionItem from '../components/AccordionItem.vue'
import BaseButton from '../components/BaseButton.vue'
import BaseChip from '../components/BaseChip.vue'
import ProductCard from '../components/ProductCard.vue'
import ProductCardCompact from '../components/ProductCardCompact.vue'
import QuantityStepper from '../components/QuantityStepper.vue'
import SectionTitle from '../components/SectionTitle.vue'

const route = useRoute()
const store = useProductsStore()
const cart = useCartStore()
const settings = useSettingsStore()
const favorites = useFavoritesStore()

const product = computed(() => store.byId(route.params.id))
const related = computed(() => {
  const p = product.value
  if (!p) return []
  const same = store.items.filter((i) => i.active && i.category === p.category && i.id !== p.id)
  const others = store.items.filter((i) => i.active && i.category !== p.category)
  return [...same, ...others].slice(0, 4)
})

// A listagem não traz as variações: busca o produto completo para mostrar tamanhos/opções reais
const detail = ref(null)
const selectedId = ref(null)
const variations = computed(() => (detail.value && String(detail.value.id) === String(route.params.id) ? detail.value.variations : []))
const variation = computed(() => variations.value.find((v) => v.id === selectedId.value) || null)
const variationTitle = computed(() => {
  const types = new Set(variations.value.map((v) => v.type))
  return types.size === 1 ? [...types][0] : 'Opções'
})
const unitPrice = computed(() => (variation.value ? variation.value.price : product.value.price))
const subtitle = computed(() => {
  const p = product.value
  const size = variation.value ? variation.value.label : p.volume
  const skin = p.skinTypes?.length ? `Pele: ${p.skinTypes.join(', ')}` : ''
  return [size, skin].filter(Boolean).join(' · ')
})

async function loadDetail(id) {
  detail.value = null
  selectedId.value = null
  try {
    detail.value = await api(`/products/${id}`)
    const first = detail.value.variations.find((v) => v.stock > 0) || detail.value.variations[0]
    selectedId.value = first ? first.id : null
  } catch {
    /* sem variações: a página usa os dados da listagem */
  }
}

function pick(v) {
  if (v.stock > 0) selectedId.value = v.id
}
const quantity = ref(1)
const favorite = computed(() => favorites.has(route.params.id))
const toggleFavorite = () => favorites.toggle(route.params.id)
const added = ref(false)
const photo = ref(0)
const images = computed(() => (product.value?.images?.length ? product.value.images : product.value?.image ? [product.value.image] : []))
watch(
  () => route.params.id,
  (id) => {
    photo.value = 0
    quantity.value = 1
    if (id) loadDetail(id)
  },
  { immediate: true },
)

const brl = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

function addToCart() {
  cart.add(product.value.id, quantity.value, variation.value && { id: variation.value.id, label: variation.value.label, price: variation.value.price })
  added.value = true
  setTimeout(() => (added.value = false), 2000)
}
</script>

<template>
  <div v-if="product" class="container">
    <!-- 01 · Navegação -->
    <nav class="flex flex-wrap items-center gap-2 pb-8 pt-4 text-sm md:pt-6" aria-label="Breadcrumb">
      <RouterLink to="/" class="hidden text-plum-muted md:inline">Início</RouterLink><span class="hidden text-plum-muted md:inline">/</span>
      <RouterLink to="/produtos" class="text-plum-muted">Produtos</RouterLink><span class="text-plum-muted">/</span>
      <RouterLink to="/produtos" class="text-plum-muted">{{ product.category }}</RouterLink><span class="text-plum-muted">/</span>
      <span class="font-medium text-plum">{{ product.name }}</span>
    </nav>

    <!-- 02 · Produto -->
    <section class="grid gap-6 md:grid-cols-2 md:gap-16">
      <!-- Galeria -->
      <div class="flex min-w-0 flex-col gap-4">
        <div class="aspect-square overflow-hidden rounded-3xl border border-line bg-lilac-soft">
          <img v-if="images[photo]" :src="images[photo]" :alt="product.name" class="size-full object-cover" />
          <div v-else class="grid size-full place-items-center text-lilac">
            <svg class="size-9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="1.5" /><path d="m21 16-5-5-8 8" />
            </svg>
          </div>
        </div>
        <div v-if="images.length > 1" class="grid grid-cols-4 gap-3 md:gap-4">
          <button
            v-for="(src, n) in images"
            :key="src"
            type="button"
            class="aspect-square cursor-pointer overflow-hidden rounded-2xl border-[1.5px] bg-lilac-soft p-0"
            :class="photo === n ? 'border-plum' : 'border-line'"
            :aria-label="`Foto ${n + 1}`"
            :aria-pressed="photo === n"
            @click="photo = n"
          >
            <img :src="src" :alt="`${product.name} — foto ${n + 1}`" class="size-full object-cover" loading="lazy" />
          </button>
        </div>
      </div>

      <!-- Informações -->
      <div class="flex min-w-0 flex-col gap-6 md:gap-7">
        <div class="flex flex-col items-start gap-3">
          <div class="flex w-full items-center justify-between">
          <span v-if="product.tag" class="rounded-full bg-plum px-3 py-1.5 font-ui text-xs font-semibold leading-[1.3] text-white">{{ product.tag }}</span>
          <span v-else />
          <button
            type="button"
            class="grid size-11 cursor-pointer place-items-center rounded-full border border-line bg-white p-0 md:hidden"
            :class="favorite ? 'text-lilac' : 'text-plum'"
            aria-label="Favoritar"
            :aria-pressed="favorite"
            @click="toggleFavorite"
          >
            <svg class="size-5" viewBox="0 0 24 24" :fill="favorite ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true"><path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10Z" /></svg>
          </button>
          </div>
          <p class="m-0 font-ui text-[11px] font-semibold uppercase leading-[1.3] tracking-[0.08em] text-lilac">{{ [product.category, product.brand].filter(Boolean).join(" · ") }}</p>
          <h1 class="m-0 font-display text-4xl font-light leading-[1.1] tracking-[-0.02em] md:text-[56px]">{{ product.name }}</h1>
          <p v-if="subtitle" class="m-0 font-ui text-sm leading-normal text-plum-muted">{{ subtitle }}</p>
        </div>

        <div>
          <p class="m-0 font-display text-[32px] font-normal md:text-[40px] leading-[1.1] tracking-[-0.01em]">{{ brl(unitPrice) }}</p>
        </div>

        <p class="m-0 font-ui text-base leading-normal text-plum-muted md:text-lg">{{ product.description }}</p>

        <div v-if="variations.length" class="flex flex-col gap-3">
          <p class="m-0 font-ui text-[13px] font-semibold">{{ variationTitle }}</p>
          <div class="flex flex-wrap gap-2">
            <BaseChip
              v-for="v in variations"
              :key="v.id"
              :label="v.stock > 0 ? v.label : `${v.label} (esgotado)`"
              :active="selectedId === v.id"
              :class="v.stock > 0 ? '' : 'opacity-50'"
              @click="pick(v)"
            />
          </div>
        </div>

        <div class="flex items-center gap-3">
          <QuantityStepper v-model="quantity" :min="1" :max="10" />
          <BaseButton class="h-14 min-w-0 flex-1" @click="addToCart"><span class="md:hidden">{{ added ? 'Adicionado ✓' : 'Adicionar' }}</span><span class="hidden md:inline">{{ added ? 'Adicionado ✓' : 'Adicionar ao carrinho' }}</span></BaseButton>
          <button
            type="button"
            class="hidden size-14 shrink-0 cursor-pointer place-items-center rounded-full border border-line bg-white p-0 md:grid"
            :class="favorite ? 'text-lilac' : 'text-plum'"
            :aria-label="favorite ? 'Remover dos favoritos' : 'Favoritar'"
            :aria-pressed="favorite"
            @click="toggleFavorite"
          >
            <svg class="size-6" viewBox="0 0 24 24" :fill="favorite ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true">
              <path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10Z" />
            </svg>
          </button>
        </div>

        <div v-if="product.usage || product.ingredients || settings.shipping" class="border-t border-line">
          <AccordionItem v-if="product.usage" title="Modo de uso" default-open><span class="whitespace-pre-line">{{ product.usage }}</span></AccordionItem>
          <AccordionItem v-if="product.ingredients" title="Ingredientes"><span class="whitespace-pre-line">{{ product.ingredients }}</span></AccordionItem>
          <AccordionItem v-if="settings.shipping" title="Envio e trocas"><span class="whitespace-pre-line">{{ settings.shipping }}</span></AccordionItem>
        </div>
      </div>
    </section>

    <!-- 03 · Relacionados -->
    <section class="flex flex-col gap-8 pt-16 md:gap-12 md:pt-[120px]">
      <div class="flex items-end justify-between gap-4">
        <SectionTitle eyebrow="Relacionados" title="Você também pode gostar" />
        <RouterLink to="/produtos" class="hidden md:block"><BaseButton variant="secondary" icon>Ver todos</BaseButton></RouterLink>
      </div>
      <div class="hidden gap-4 md:flex">
        <ProductCard v-for="p in related" :key="p.id" v-bind="p" />
      </div>
      <div class="grid grid-cols-2 gap-4 md:hidden">
        <ProductCardCompact v-for="p in related" :key="p.id" v-bind="p" />
      </div>
    </section>
  </div>

  <div v-else-if="store.loaded" class="container flex flex-col items-center gap-6 py-32 text-center">
    <h1 class="m-0 font-display text-4xl font-light">Produto não encontrado</h1>
    <RouterLink to="/produtos"><BaseButton>Ver produtos</BaseButton></RouterLink>
  </div>
</template>
