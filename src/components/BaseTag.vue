<script setup>
defineProps({
  text: {
    type: String,
    default: '',
  },
  variant: {
    type: String,
    default: 'plum',
    validator: (val) => ['plum', 'lilac', 'soft', 'outline'].includes(val),
  },
})
</script>

<template>
  <span
    class="inline-flex items-center justify-center h-[26px] px-3 rounded-full font-ui text-xs font-semibold tracking-wider whitespace-nowrap box-border"
    :class="{
      'bg-plum text-white': variant === 'plum',
      'bg-lilac text-white': variant === 'lilac',
      'bg-lilac-soft text-plum': variant === 'soft',
      'bg-transparent text-plum border border-line': variant === 'outline',
    }"
  >
    <slot>{{ text }}</slot>
  </span>
</template>
