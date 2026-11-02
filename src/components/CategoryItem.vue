<script setup>
defineProps({
  name: {
    type: String,
    required: true,
  },
  active: {
    type: Boolean,
    default: false,
  },
  count: {
    type: [Number, String],
    default: null,
  },
})

defineEmits(['click'])
</script>

<template>
  <button
    type="button"
    class="flex w-full h-[63px] items-center justify-between py-[18px] bg-transparent border-0 border-b border-line cursor-pointer text-left font-ui text-xl leading-[1.3]"
    :class="active ? 'text-plum font-semibold' : 'text-plum-muted font-normal hover:text-plum'"
    @click="$emit('click', $event)"
  >
    <span class="flex items-center gap-3">
      <span v-if="active" class="size-2 rounded-full bg-lilac" aria-hidden="true" />
      <span>{{ name }}</span>
      <span v-if="count !== null" class="text-[13px] opacity-70">({{ count }})</span>
    </span>
    <svg
      class="size-5 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="m9 6 6 6-6 6" />
    </svg>
  </button>
</template>
