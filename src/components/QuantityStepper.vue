<script setup>
const props = defineProps({
  modelValue: {
    type: Number,
    default: 1,
  },
  min: {
    type: Number,
    default: 1,
  },
  max: {
    type: Number,
    default: 99,
  },
})

const emit = defineEmits(['update:modelValue'])

function step(delta) {
  const next = props.modelValue + delta
  if (next >= props.min && next <= props.max) emit('update:modelValue', next)
}
</script>

<template>
  <div class="inline-flex h-14 w-[142px] shrink-0 items-center justify-between rounded-full border border-line bg-white px-5 text-plum">
    <button type="button" class="grid size-6 cursor-pointer place-items-center border-0 bg-transparent p-0 text-plum disabled:opacity-40" :disabled="modelValue <= min" aria-label="Diminuir" @click="step(-1)">
      <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14" /></svg>
    </button>
    <span class="font-ui text-[15px] font-medium" aria-live="polite">{{ modelValue }}</span>
    <button type="button" class="grid size-6 cursor-pointer place-items-center border-0 bg-transparent p-0 text-plum disabled:opacity-40" :disabled="modelValue >= max" aria-label="Aumentar" @click="step(1)">
      <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
    </button>
  </div>
</template>
