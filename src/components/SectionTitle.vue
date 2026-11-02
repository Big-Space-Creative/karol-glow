<script setup>
defineProps({
  eyebrow: {
    type: String,
    default: '',
  },
  title: {
    type: String,
    required: true,
  },
  subtitle: {
    type: String,
    default: '',
  },
  align: {
    type: String,
    default: 'left',
    validator: (val) => ['left', 'center', 'right'].includes(val),
  },
})
</script>

<template>
  <div
    class="flex flex-col gap-4"
    :class="{
      'items-center text-center': align === 'center',
      'items-start text-left': align === 'left',
      'items-end text-right': align === 'right',
    }"
  >
    <p v-if="eyebrow" class="m-0 font-ui text-sm font-semibold leading-[1.3] tracking-[0.04em] text-lilac">
      {{ eyebrow }}
    </p>
    <h2 class="m-0 font-display text-[32px] md:text-[56px] font-light leading-[1.1] tracking-[-0.02em] text-plum">
      {{ title }}
    </h2>
    <p v-if="subtitle" class="m-0 mt-1 max-w-[640px] font-ui text-base md:text-lg leading-normal text-plum-muted">
      {{ subtitle }}
    </p>
  </div>
</template>
