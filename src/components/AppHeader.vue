<script setup>
import { computed, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useCartStore } from '../stores/cart'
import { useProductsStore } from '../stores/products'
import { useSettingsStore } from '../stores/settings'
import { buildOrderMessage, whatsappUrl } from '../services/whatsapp'
import logo from '../assets/Logo.svg'
import BaseButton from './BaseButton.vue'
import CartDrawer from './CartDrawer.vue'

const route = useRoute()
const cart = useCartStore()
const products = useProductsStore()
const settings = useSettingsStore()
const menuOpen = ref(false)

const links = [
  { label: 'Início', to: '/' },
  { label: 'Sobre', to: { path: '/', hash: '#sobre' } },
  { label: 'Mais vendidos', to: { path: '/', hash: '#mais-vendidos' } },
  { label: 'Produtos', to: '/produtos' },
  { label: 'Contato', to: { path: '/', hash: '#contato' } },
]

const isActive = (link) => {
  if (typeof link.to === 'string') {
    return link.to === '/' ? route.path === '/' && !route.hash : route.path.startsWith(link.to)
  }
  return route.path === '/' && route.hash === link.to.hash
}

const cartCount = computed(() => cart.count)

// "Comprar agora": abre o WhatsApp da Karol Glow com a sacola (ou a mensagem padrão se estiver vazia)
const buyUrl = computed(() => whatsappUrl(settings.phone, buildOrderMessage(cart.resolve(products))))
</script>

<template>
  <header class="relative flex h-[68px] items-center justify-between md:h-[100px] md:py-6">
    <RouterLink to="/" class="inline-flex items-center" aria-label="Karol Glow">
      <img :src="logo" alt="Karol Glow" class="h-[38px] w-auto" />
    </RouterLink>

    <nav class="hidden items-start gap-9 md:flex" aria-label="Principal">
      <RouterLink
        v-for="l in links"
        :key="l.label"
        :to="l.to"
        class="font-ui text-[15px] leading-[1.3] no-underline"
        :class="isActive(l) ? 'font-semibold text-plum' : 'font-medium text-plum-muted hover:text-plum'"
      >{{ l.label }}</RouterLink>
    </nav>

    <div class="flex items-center gap-3">
      <RouterLink
        to="/produtos"
        class="hidden size-11 place-items-center rounded-full border border-line bg-white text-plum md:grid"
        aria-label="Buscar produtos"
      >
        <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="11" cy="11" r="6.5" />
          <path d="m20 20-4.2-4.2" />
        </svg>
      </RouterLink>
      <button
        type="button"
        class="relative grid size-11 cursor-pointer place-items-center rounded-full border border-line bg-white p-0 text-plum"
        aria-label="Abrir sacola"
        @click="cart.show()"
      >
        <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M6 8h12l-1 12H7L6 8Z" />
          <path d="M9 8V6a3 3 0 0 1 6 0v2" />
        </svg>
        <span v-if="cartCount" class="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-lilac px-1 text-[11px] font-semibold leading-5 text-white">{{ cartCount }}</span>
      </button>
      <a :href="buyUrl" target="_blank" rel="noopener noreferrer" class="hidden no-underline md:block"><BaseButton>Comprar agora</BaseButton></a>
      <button
        type="button"
        class="grid size-11 cursor-pointer place-items-center rounded-full border border-line bg-white p-0 text-plum md:hidden"
        :aria-expanded="menuOpen"
        aria-label="Menu"
        @click="menuOpen = !menuOpen"
      >
        <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true">
          <path v-if="!menuOpen" d="M4 7h16M4 12h16M4 17h16" />
          <path v-else d="m6 6 12 12M18 6 6 18" />
        </svg>
      </button>
    </div>

    <nav v-if="menuOpen" class="absolute inset-x-0 top-[68px] z-40 flex flex-col rounded-2xl border border-line bg-white p-4 shadow-lg md:hidden" aria-label="Menu mobile">
      <RouterLink
        v-for="l in links"
        :key="l.label"
        :to="l.to"
        class="border-b border-line py-3 font-ui text-base no-underline last:border-0"
        :class="isActive(l) ? 'font-semibold text-plum' : 'text-plum-muted'"
        @click="menuOpen = false"
      >{{ l.label }}</RouterLink>
    </nav>
    <CartDrawer />
  </header>
</template>
