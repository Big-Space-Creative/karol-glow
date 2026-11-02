<script setup>
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  label: {
    type: String,
    default: '',
  },
  description: {
    type: String,
    default: '',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue'])

function toggle() {
  if (!props.disabled) {
    emit('update:modelValue', !props.modelValue)
  }
}
</script>

<template>
  <label
    class="inline-flex items-start gap-3 cursor-pointer select-none"
    :class="{ 'opacity-50 pointer-events-none': disabled }"
    @click.prevent="toggle"
  >
    <div
      class="w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors duration-200"
      :class="[
        modelValue
          ? 'bg-plum border-plum text-white'
          : 'bg-white border-line text-transparent',
      ]"
    >
      <svg
        class="w-3.5 h-3.5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="3"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </div>

    <div v-if="label || description" class="flex flex-col">
      <span v-if="label" class="font-ui text-sm font-medium text-plum">
        {{ label }}
      </span>
      <span v-if="description" class="font-ui text-xs text-plum-muted mt-0.5">
        {{ description }}
      </span>
    </div>
  </label>
</template>
