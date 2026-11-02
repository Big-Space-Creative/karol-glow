<script setup>
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
})
</script>

<template>
  <div class="relative flex w-full flex-col overflow-hidden rounded-3xl text-plum md:h-[320px] md:w-[640px] md:flex-row md:rounded-[28px] md:p-8">
    <img :src="image" alt="" class="h-[220px] w-full rounded-3xl object-cover md:pointer-events-none md:absolute md:inset-0 md:h-full md:rounded-[28px]" />
    <div class="relative flex flex-col gap-2 p-5 md:w-[300px] md:max-w-full md:justify-between md:gap-0 md:p-0">
      <h3 class="m-0 font-display text-[24px] font-normal leading-[1.2] tracking-[-0.01em] md:text-[28px]">{{ title }}</h3>
      <p class="m-0 font-ui text-sm leading-normal text-plum-muted md:text-base md:text-plum">{{ description }}</p>
    </div>
  </div>
</template>
