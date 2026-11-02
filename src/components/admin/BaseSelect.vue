<script setup>
import { computed } from 'vue'

const props = defineProps({
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
    default: () => [],
  },
  placeholder: {
    type: String,
    default: 'Selecione...',
  },
  error: {
    type: String,
    default: '',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  required: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['update:modelValue'])

const normalizedOptions = computed(() => {
  return props.options.map((opt) => {
    if (typeof opt === 'object' && opt !== null) {
      return { label: opt.label, value: opt.value }
    }
    return { label: String(opt), value: opt }
  })
})
</script>

<template>
  <div class="flex flex-col w-full">
    <label v-if="label" class="font-ui text-xs font-semibold uppercase tracking-wider text-plum-muted block mb-1.5">
      {{ label }}
      <span v-if="required" class="text-lilac">*</span>
    </label>

    <div class="relative flex items-center">
      <select
        :value="modelValue"
        :disabled="disabled"
        :required="required"
        class="w-full h-12 pl-4 pr-10 bg-white border border-line rounded-xl font-ui text-[15px] text-plum transition-colors duration-200 focus:outline-none focus:border-plum disabled:opacity-50 disabled:bg-white appearance-none cursor-pointer"
        :class="[error ? 'border-lilac' : '']"
        @change="$emit('update:modelValue', $event.target.value)"
      >
        <option v-if="placeholder" value="" disabled :selected="!modelValue">
          {{ placeholder }}
        </option>
        <option
          v-for="opt in normalizedOptions"
          :key="opt.value"
          :value="opt.value"
        >
          {{ opt.label }}
        </option>
      </select>

      <svg
        class="w-4 h-4 text-plum-muted absolute right-3.5 pointer-events-none"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </div>

    <span v-if="error" class="font-ui text-xs text-lilac mt-1">
      {{ error }}
    </span>
  </div>
</template>
