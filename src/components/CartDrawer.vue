<script setup>
import { computed, onBeforeUnmount, onMounted, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useCartStore } from '../stores/cart'
import { useProductsStore } from '../stores/products'
import { useSettingsStore } from '../stores/settings'
import { buildOrderMessage, whatsappUrl } from '../services/whatsapp'

const cart = useCartStore()
const products = useProductsStore()
const settings = useSettingsStore()

const brl = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

// Só entram itens que ainda existem e estão à venda
const items = computed(() => cart.resolve(products))
const total = computed(() => items.value.reduce((s, i) => s + i.price * i.qty, 0))
const link = computed(() => whatsappUrl(settings.phone, buildOrderMessage(items.value)))

const onKey = (e) => e.key === 'Escape' && cart.hide()
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  document.body.style.overflow = ''
})
watch(
  () => cart.open,
  (open) => (document.body.style.overflow = open ? 'hidden' : ''),
)
</script>

<template>
  <Teleport to="body">
    <div v-if="cart.open" class="fixed inset-0 z-50">
      <div class="absolute inset-0 bg-plum/60" aria-hidden="true" @click="cart.hide()" />
      <aside class="absolute inset-y-0 right-0 flex w-full max-w-[420px] flex-col bg-white shadow-2xl" role="dialog" aria-modal="true" aria-label="Sacola">
        <div class="flex items-center justify-between border-b border-line px-6 py-5">
          <h2 class="m-0 font-display text-2xl font-light text-plum">Sua sacola</h2>
          <button type="button" class="grid size-10 cursor-pointer place-items-center rounded-full border border-line bg-white p-0 text-plum" aria-label="Fechar" @click="cart.hide()">
            <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
          </button>
        </div>

        <div v-if="items.length" class="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-5">
          <div v-for="i in items" :key="i.key" class="flex gap-3">
            <div class="size-16 shrink-0 overflow-hidden rounded-xl border border-line bg-lilac-soft">
              <img v-if="i.image" :src="i.image" :alt="i.name" class="size-full object-cover" />
            </div>
            <div class="flex min-w-0 flex-1 flex-col gap-1.5">
              <RouterLink :to="`/produtos/${i.id}`" class="truncate font-ui text-sm font-medium text-plum no-underline" @click="cart.hide()">{{ i.name }}</RouterLink>
              <span class="font-ui text-sm text-plum-muted">{{ brl(i.price) }}</span>
              <div class="flex items-center gap-3">
                <div class="inline-flex h-8 items-center rounded-full border border-line px-1">
                  <button type="button" class="grid size-6 cursor-pointer place-items-center border-0 bg-transparent p-0 text-plum" aria-label="Diminuir" @click="cart.setQty(i.key, i.qty - 1)">−</button>
                  <span class="w-7 text-center font-ui text-sm">{{ i.qty }}</span>
                  <button type="button" class="grid size-6 cursor-pointer place-items-center border-0 bg-transparent p-0 text-plum" aria-label="Aumentar" @click="cart.setQty(i.key, i.qty + 1)">+</button>
                </div>
                <button type="button" class="cursor-pointer border-0 bg-transparent p-0 font-ui text-xs text-plum-muted underline" @click="cart.remove(i.key)">Remover</button>
              </div>
            </div>
            <span class="font-ui text-sm font-semibold text-plum">{{ brl(i.price * i.qty) }}</span>
          </div>
        </div>
        <div v-else class="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
          <p class="m-0 font-display text-2xl font-light text-plum">Sua sacola está vazia</p>
          <p class="m-0 font-ui text-sm text-plum-muted">Escolha seus produtos ou fale com a gente pelo WhatsApp.</p>
          <RouterLink to="/produtos" class="font-ui text-sm font-medium text-plum underline" @click="cart.hide()">Ver produtos</RouterLink>
        </div>

        <div class="flex flex-col gap-3 border-t border-line px-6 py-5">
          <div v-if="items.length" class="flex items-center justify-between font-ui text-base text-plum">
            <span>Total</span><span class="text-xl font-semibold">{{ brl(total) }}</span>
          </div>
          <a
            :href="link"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex h-12 items-center justify-center rounded-full border border-plum bg-plum px-6 font-ui text-base text-white no-underline hover:bg-plum-muted"
            @click="cart.hide()"
          >{{ items.length ? 'Finalizar pelo WhatsApp' : 'Falar no WhatsApp' }}</a>
          <button v-if="items.length" type="button" class="cursor-pointer border-0 bg-transparent p-0 font-ui text-xs text-plum-muted underline" @click="cart.clear()">Esvaziar sacola</button>
        </div>
      </aside>
    </div>
  </Teleport>
</template>
