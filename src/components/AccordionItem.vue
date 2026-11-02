<script setup>
import { ref } from 'vue'

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  defaultOpen: {
    type: Boolean,
    default: false,
  },
})

const open = ref(props.defaultOpen)
</script>

<template>
  <div class="border-b border-line">
    <button
      type="button"
      class="flex w-full cursor-pointer items-center justify-between border-0 bg-transparent py-5 text-left font-ui text-lg leading-[1.3] text-plum"
      :aria-expanded="open"
      @click="open = !open"
    >
      <span>{{ title }}</span>
      <svg
        class="size-[18px] shrink-0 transition-transform"
        :class="open ? 'rotate-180' : ''"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      ><path d="m6 9 6 6 6-6" /></svg>
    </button>
    <div v-show="open" class="pb-5 font-ui text-sm leading-normal text-plum-muted">
      <slot />
    </div>
  </div>
</template>
