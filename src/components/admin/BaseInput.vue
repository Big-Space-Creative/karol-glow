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
  placeholder: {
    type: String,
    default: '',
  },
  type: {
    type: String,
    default: 'text',
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
  step: {
    type: [String, Number],
    default: undefined,
  },
  prefix: {
    type: String,
    default: '',
  },
})

defineEmits(['update:modelValue'])
</script>

<template>
  <div class="flex flex-col w-full">
    <label v-if="label" class="font-ui text-xs font-semibold uppercase tracking-wider text-plum-muted block mb-1.5">
      {{ label }}
      <span v-if="required" class="text-lilac">*</span>
    </label>

    <div class="relative flex items-center">
      <span
        v-if="prefix"
        class="absolute left-4 font-ui text-[15px] text-plum-muted pointer-events-none select-none"
      >
        {{ prefix }}
      </span>
      <input
        :value="modelValue"
        :type="type"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        :step="step"
        class="w-full h-12 bg-white border border-line rounded-xl font-ui text-[15px] text-plum placeholder:text-plum-muted transition-colors duration-200 focus:outline-none focus:border-plum disabled:opacity-50 disabled:bg-white"
        :class="[
          prefix ? 'pl-11 pr-4' : 'px-4',
          error ? 'border-lilac' : '',
        ]"
        @input="$emit('update:modelValue', $event.target.value)"
      />
    </div>

    <span v-if="error" class="font-ui text-xs text-lilac mt-1">
      {{ error }}
    </span>
  </div>
</template>
