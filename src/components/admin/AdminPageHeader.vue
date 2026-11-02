<script setup>
defineProps({
  eyebrow: {
    type: String,
    default: 'Painel',
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
})
</script>

<template>
  <div class="flex flex-col justify-between gap-6 pb-6 pt-6 md:flex-row md:items-end md:pb-8 md:pt-[56px]">
    <div class="flex flex-col gap-4">
      <p class="m-0 font-ui text-sm font-semibold leading-[1.3] tracking-[0.04em] text-lilac">{{ eyebrow }}</p>
      <h1 class="m-0 font-display text-[32px] font-light leading-[1.1] tracking-[-0.02em] text-plum md:text-[56px]">{{ title }}</h1>
      <p v-if="description" class="m-0 max-w-[720px] font-ui text-base leading-normal text-plum-muted md:text-lg">{{ description }}</p>
    </div>
    <div v-if="$slots.actions" class="flex w-full shrink-0 items-center gap-3 md:w-auto">
      <slot name="actions" />
    </div>
  </div>
</template>
