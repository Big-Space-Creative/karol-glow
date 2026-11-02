<script setup>
defineProps({
  modelValue: {
    type: [String, Number],
    default: '',
  },
  label: {
    type: String,
    default: '',
  },
  options: {
    type: Array,
    required: true, // [{ label, value }]
  },
})

defineEmits(['update:modelValue'])
</script>

<template>
  <label class="flex h-11 cursor-pointer items-center gap-1.5 rounded-full border border-line bg-white pl-5 pr-3.5">
    <span v-if="label" class="whitespace-nowrap font-ui text-sm text-plum-muted">{{ label }}</span>
    <select
      :value="modelValue"
      class="min-w-0 cursor-pointer appearance-none border-0 bg-transparent py-0 pr-1 font-ui text-sm font-medium text-plum outline-none"
      @change="$emit('update:modelValue', $event.target.value)"
    >
      <option v-for="o in options" :key="o.value" :value="o.value">{{ o.label }}</option>
    </select>
    <svg class="size-[18px] shrink-0 text-plum" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
  </label>
</template>
