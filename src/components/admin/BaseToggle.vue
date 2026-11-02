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
  <div
    class="flex items-center justify-between gap-4 cursor-pointer select-none"
    :class="{ 'opacity-50 pointer-events-none': disabled }"
    @click="toggle"
  >
    <div v-if="label || description" class="flex flex-col">
      <span v-if="label" class="font-ui text-sm font-medium text-plum">
        {{ label }}
      </span>
      <span v-if="description" class="font-ui text-xs text-plum-muted mt-0.5">
        {{ description }}
      </span>
    </div>

    <button
      type="button"
      role="switch"
      :aria-checked="modelValue"
      :disabled="disabled"
      class="w-12 h-6.5 rounded-full transition-colors duration-200 relative p-0.5 border-none cursor-pointer shrink-0"
      :class="[modelValue ? 'bg-plum' : 'bg-line']"
      @click.stop="toggle"
    >
      <span
        class="block w-5 h-5 bg-white rounded-full shadow transition-transform duration-200"
        :class="[modelValue ? 'translate-x-5.5' : 'translate-x-0.5']"
      />
    </button>
  </div>
</template>
