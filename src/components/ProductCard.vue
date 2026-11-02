<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useCartStore } from '../stores/cart'

const props = defineProps({
  id: {
    type: [Number, String],
    default: '',
  },
  name: {
    type: String,
    required: true,
  },
  // Rótulo de categoria (caixa alta, lilás)
  category: {
    type: String,
    default: '',
  },
  // Mantida por compatibilidade com os dados da store
  brand: {
    type: String,
    default: '',
  },
  description: {
    type: String,
    default: '',
  },
  price: {
    type: [Number, String],
    required: true,
  },
  image: {
    type: String,
    default: '',
  },
  tag: {
    type: String,
    default: '',
  },
})

defineEmits(['favorite'])

const cart = useCartStore()

const formattedPrice = computed(() => {
  if (typeof props.price === 'number') {
    return props.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }
  return String(props.price).startsWith('R$') ? props.price : `R$ ${props.price}`
})

const productLink = computed(() => (props.id ? `/produtos/${props.id}` : '/produtos'))
</script>

<template>
  <div class="flex w-[316px] max-w-full flex-col gap-4 rounded-3xl border-2 border-lilac-soft bg-white pt-3 px-3 pb-5 box-border">
    <div class="relative size-[292px] max-w-full overflow-hidden rounded-[18px]">
      <RouterLink :to="productLink" class="block size-full" :aria-label="name">
        <img v-if="image" :src="image" :alt="name" class="size-full object-cover" loading="lazy" />
        <div
          v-else
          class="flex size-full flex-col items-center justify-center gap-2 rounded-[18px] border-[1.5px] border-dashed border-lilac bg-lilac-soft"
        >
          <svg class="size-9 text-lilac" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <circle cx="9" cy="10" r="1.5" />
            <path d="m21 16-5-5-8 8" />
          </svg>
          <span class="font-ui text-[13px] font-semibold leading-[1.3] text-lilac">IMAGEM · Produto</span>
          <span class="font-ui text-xs leading-[1.3] text-plum-muted">292 × 292 px</span>
        </div>
      </RouterLink>

      <span v-if="tag" class="absolute left-3.5 top-3.5 rounded-full bg-plum px-3 py-1.5 font-ui text-xs font-semibold leading-[1.3] text-white">
        {{ tag }}
      </span>

      <button
        type="button"
        class="absolute right-3.5 top-3.5 grid size-10 cursor-pointer place-items-center rounded-full border-0 bg-white p-0 text-plum hover:text-lilac"
        aria-label="Adicionar aos favoritos"
        @click.stop="$emit('favorite', id)"
      >
        <svg class="size-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10Z" />
        </svg>
      </button>
    </div>

    <div class="flex flex-col gap-1.5 px-2">
      <p v-if="category" class="m-0 font-ui text-[11px] font-semibold uppercase leading-[1.3] tracking-[0.08em] text-lilac">{{ category }}</p>
      <RouterLink :to="productLink" class="font-ui text-lg font-medium leading-[1.3] text-plum no-underline">{{ name }}</RouterLink>
      <p v-if="description" class="m-0 font-ui text-sm leading-normal text-plum-muted truncate">{{ description }}</p>
    </div>

    <div class="flex items-center justify-between px-2">
      <span class="font-ui text-xl font-semibold leading-[1.3] text-plum">{{ formattedPrice }}</span>
      <button
        type="button"
        class="grid size-11 cursor-pointer place-items-center rounded-full border-0 bg-plum p-0 text-white hover:bg-plum-muted"
        aria-label="Adicionar ao carrinho"
        @click.stop="id && cart.add(id)"
      >
        <svg class="size-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M6 8h12l-1 12H7L6 8Z" />
          <path d="M9 8V6a3 3 0 0 1 6 0v2" />
        </svg>
      </button>
    </div>
  </div>
</template>
