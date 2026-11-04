<script setup>
import { computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useCartStore } from '../stores/cart'
import { useFavoritesStore } from '../stores/favorites'

const props = defineProps({
  id: {
    type: [Number, String],
    default: '',
  },
  name: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    default: '',
  },
  // Mantida por compatibilidade com os dados da store
  brand: {
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
  // Produto com variações (tamanho, cor...): a escolha é feita na página do produto
  hasVariations: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['favorite'])

const cart = useCartStore()
const router = useRouter()

function quickAdd() {
  if (!props.id) return
  if (props.hasVariations) router.push(`/produtos/${props.id}`)
  else cart.add(props.id)
}
const favorites = useFavoritesStore()
const isFavorite = computed(() => Boolean(props.id) && favorites.has(props.id))

const formattedPrice = computed(() => {
  if (typeof props.price === 'number') {
    return props.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }
  return String(props.price).startsWith('R$') ? props.price : `R$ ${props.price}`
})

const productLink = computed(() => (props.id ? `/produtos/${props.id}` : '/produtos'))
</script>

<template>
  <div class="flex w-full min-w-0 flex-col gap-2.5 rounded-3xl border-2 border-lilac-soft bg-white px-2 pb-3 pt-2 box-border">
    <div class="relative aspect-square w-full overflow-hidden rounded-2xl">
      <RouterLink :to="productLink" class="block size-full" :aria-label="name">
        <img v-if="image" :src="image" :alt="name" class="size-full object-cover" loading="lazy" />
        <div v-else class="flex size-full flex-col items-center justify-center gap-1.5 rounded-2xl border-[1.5px] border-dashed border-lilac bg-lilac-soft text-lilac">
          <svg class="size-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="1.5" /><path d="m21 16-5-5-8 8" />
          </svg>
          <span class="font-ui text-xs font-semibold uppercase">Produto</span>
        </div>
      </RouterLink>
      <span v-if="tag" class="absolute left-2 top-2 rounded-full bg-plum px-2.5 py-1 font-ui text-[11px] font-semibold leading-[1.3] text-white">{{ tag }}</span>
      <button
        type="button"
        class="absolute right-2 top-2 grid size-8 cursor-pointer place-items-center rounded-full border-0 bg-white p-0 text-plum"
        :class="isFavorite ? '!text-lilac' : ''"
        :aria-label="isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'"
        :aria-pressed="isFavorite"
        @click.stop="id && (favorites.toggle(id), $emit('favorite', id))"
      >
        <svg class="size-4" viewBox="0 0 24 24" :fill="isFavorite ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10Z" />
        </svg>
      </button>
    </div>

    <div class="flex flex-col gap-1 px-1">
      <p v-if="category" class="m-0 font-ui text-[10px] font-semibold uppercase leading-[1.3] tracking-[0.08em] text-lilac">{{ category }}</p>
      <RouterLink :to="productLink" class="truncate font-ui text-sm leading-[1.3] text-plum no-underline">{{ name }}</RouterLink>
    </div>

    <div class="flex items-center justify-between px-1">
      <span class="font-ui text-[15px] font-semibold leading-[1.3] text-plum">{{ formattedPrice }}</span>
      <button
        type="button"
        class="grid size-8 shrink-0 cursor-pointer place-items-center rounded-full border-0 bg-plum p-0 text-white"
        aria-label="Adicionar ao carrinho"
        @click.stop="quickAdd"
      >
        <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M6 8h12l-1 12H7L6 8Z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" />
        </svg>
      </button>
    </div>
  </div>
</template>
