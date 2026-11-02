<script setup>
defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (val) => ['primary', 'secondary'].includes(val),
  },
  type: {
    type: String,
    default: 'button',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  block: {
    type: Boolean,
    default: false,
  },
  // Seta à direita do rótulo (como no Figma)
  icon: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['click'])
</script>

<template>
  <button
    :type="type"
    :disabled="disabled"
    class="inline-flex items-center justify-center gap-2.5 px-[26px] py-3.5 rounded-full font-ui leading-[1.3] cursor-pointer transition-colors duration-200 whitespace-nowrap box-border disabled:opacity-50 disabled:cursor-not-allowed"
    :class="[
      block ? 'w-full' : '',
      variant === 'primary'
        ? 'bg-plum text-white text-base font-normal border border-plum hover:not-disabled:bg-plum-muted hover:not-disabled:border-plum-muted'
        : 'bg-transparent text-plum text-[15px] font-medium border border-plum hover:not-disabled:bg-lilac-soft',
    ]"
    @click="$emit('click', $event)"
  >
    <slot />
    <svg
      v-if="icon"
      class="size-[18px] shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  </button>
</template>
