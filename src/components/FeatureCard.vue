<script setup>
defineProps({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  // Mantida por compatibilidade; o card do Figma não exibe selo.
  badge: {
    type: String,
    default: '',
  },
})
</script>

<template>
  <div class="flex flex-col justify-between w-full md:w-[320px] min-h-[200px] md:h-[320px] p-6 md:p-8 rounded-3xl md:rounded-[28px] gap-6 bg-plum text-white box-border">
    <h3 class="m-0 text-white whitespace-pre-line font-display text-[28px] font-normal leading-[1.2] tracking-[-0.01em] max-w-[256px]">
      {{ title }}
    </h3>
    <p class="m-0 font-ui text-base leading-normal max-w-[256px]">
      {{ description }}
    </p>
  </div>
</template>
