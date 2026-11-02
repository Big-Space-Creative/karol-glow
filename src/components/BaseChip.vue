<script setup>
defineProps({
  active: {
    type: Boolean,
    default: false,
  },
  label: {
    type: String,
    default: '',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['click'])
</script>

<template>
  <button
    type="button"
    :disabled="disabled"
    class="inline-flex shrink-0 cursor-pointer items-center rounded-full px-5 py-[11px] font-ui text-[15px] font-medium leading-[1.3] whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-50"
    :class="active ? 'border border-plum bg-plum text-white' : 'border border-line bg-white text-plum hover:border-plum'"
    :aria-pressed="active"
    @click="$emit('click', $event)"
  >
    <slot>{{ label }}</slot>
  </button>
</template>
