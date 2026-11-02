<script setup>
defineProps({
  active: {
    type: Boolean,
    default: true,
  },
  label: {
    type: String,
    default: '',
  },
})
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-ui text-xs tracking-wide whitespace-nowrap"
    :class="[
      active
        ? 'bg-lilac-soft text-plum font-semibold'
        : 'bg-line text-plum-muted font-medium',
    ]"
  >
    <span
      class="w-1.5 h-1.5 rounded-full"
      :class="[active ? 'bg-lilac' : 'bg-plum-muted']"
    />
    <span>{{ label || (active ? 'Ativo' : 'Inativo') }}</span>
  </span>
</template>
