<script setup>
import { computed } from 'vue'

const props = defineProps({
  currentPage: {
    type: Number,
    default: 1,
  },
  totalPages: {
    type: Number,
    default: 1,
  },
})

const emit = defineEmits(['update:currentPage', 'change'])

// 1 2 3 … 8, como no Figma
const pages = computed(() => {
  const total = props.totalPages
  const current = props.currentPage
  if (total <= 6) return Array.from({ length: total }, (_, i) => i + 1)
  const set = new Set([1, 2, 3, total, current - 1, current, current + 1])
  const list = [...set].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b)
  const out = []
  list.forEach((n, i) => {
    if (i && n - list[i - 1] > 1) out.push('…')
    out.push(n)
  })
  return out
})

function go(page) {
  if (page < 1 || page > props.totalPages || page === props.currentPage) return
  emit('update:currentPage', page)
  emit('change', page)
}
</script>

<template>
  <nav class="flex items-center gap-2" aria-label="Paginação">
    <button
      type="button"
      class="grid size-11 cursor-pointer place-items-center rounded-full border border-line bg-white p-0 text-plum disabled:cursor-not-allowed disabled:opacity-40"
      :disabled="currentPage <= 1"
      aria-label="Página anterior"
      @click="go(currentPage - 1)"
    >
      <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
    </button>
    <template v-for="(p, i) in pages" :key="`${p}-${i}`">
      <span v-if="p === '…'" class="grid size-11 place-items-center font-ui text-[15px] font-medium text-plum">…</span>
      <button
        v-else
        type="button"
        class="grid size-11 cursor-pointer place-items-center rounded-full border-0 p-0 font-ui text-[15px] font-medium"
        :class="p === currentPage ? 'bg-plum text-white' : 'bg-transparent text-plum hover:bg-lilac-soft'"
        :aria-current="p === currentPage ? 'page' : undefined"
        @click="go(p)"
      >{{ p }}</button>
    </template>
    <button
      type="button"
      class="grid size-11 cursor-pointer place-items-center rounded-full border border-line bg-white p-0 text-plum disabled:cursor-not-allowed disabled:opacity-40"
      :disabled="currentPage >= totalPages"
      aria-label="Próxima página"
      @click="go(currentPage + 1)"
    >
      <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
    </button>
  </nav>
</template>
