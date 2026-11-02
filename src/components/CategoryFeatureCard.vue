<script setup>
import { RouterLink } from 'vue-router'

defineProps({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  image: {
    type: String,
    required: true,
  },
  linkLabel: {
    type: String,
    default: 'Ver produtos da categoria',
  },
  to: {
    type: [String, Object],
    default: '/produtos',
  },
})
</script>

<template>
  <div class="flex flex-col w-full overflow-hidden rounded-[32px] bg-white">
    <div class="flex flex-col gap-4 px-6 md:px-10 pt-8 md:pt-10 pb-8">
      <h3 class="m-0 font-display text-4xl font-normal leading-[1.15] tracking-[-0.01em] text-plum">{{ title }}</h3>
      <p class="m-0 max-w-[480px] font-ui text-base leading-normal text-plum-muted">{{ description }}</p>
      <RouterLink :to="to" class="inline-flex items-center gap-3 no-underline">
        <span class="grid size-9 place-items-center rounded-full bg-lilac-soft text-plum">
          <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </span>
        <span class="font-ui text-sm font-medium leading-[1.3] text-plum">{{ linkLabel }}</span>
      </RouterLink>
    </div>
    <div class="relative mx-5 mb-5 h-[200px] overflow-hidden rounded-2xl md:m-0 md:h-[420px] md:rounded-none">
      <img :src="image" alt="" class="absolute inset-0 size-full object-cover" />
    </div>
  </div>
</template>
