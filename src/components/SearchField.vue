<script setup>
defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  placeholder: {
    type: String,
    default: 'Buscar produto',
  },
})

const emit = defineEmits(['update:modelValue', 'submit'])
</script>

<template>
  <form
    class="flex h-11 w-full items-center gap-2.5 rounded-full border border-line bg-white pl-[18px] pr-5 md:w-[280px]"
    role="search"
    @submit.prevent="emit('submit', modelValue)"
  >
    <svg class="size-[18px] shrink-0 text-plum-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-4.2-4.2" />
    </svg>
    <input
      :value="modelValue"
      type="search"
      :placeholder="placeholder"
      :aria-label="placeholder"
      class="min-w-0 flex-1 border-0 bg-transparent p-0 font-ui text-sm leading-normal text-plum outline-none placeholder:text-plum-muted"
      @input="emit('update:modelValue', $event.target.value)"
    />
  </form>
</template>
