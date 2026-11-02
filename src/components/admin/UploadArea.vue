<script setup>
import { ref } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  label: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue'])
const fileInput = ref(null)

function triggerFileInput() {
  fileInput.value?.click()
}

function handleFileChange(event) {
  const file = event.target.files?.[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      emit('update:modelValue', e.target.result)
    }
    reader.readAsDataURL(file)
  }
}

function removeImage() {
  emit('update:modelValue', '')
  if (fileInput.value) fileInput.value.value = ''
}
</script>

<template>
  <div class="flex flex-col w-full">
    <label v-if="label" class="font-ui text-xs font-semibold uppercase tracking-wider text-plum-muted block mb-1.5">
      {{ label }}
    </label>

    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      class="hidden"
      @change="handleFileChange"
    />

    <!-- Preview when image exists -->
    <div
      v-if="modelValue"
      class="relative w-full h-48 md:h-56 bg-white border border-line rounded-2xl overflow-hidden group flex items-center justify-center"
    >
      <img
        :src="modelValue"
        alt="Preview da imagem"
        class="w-full h-full object-contain"
      />
      <div class="absolute inset-0 bg-plum-muted/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
        <button
          type="button"
          class="px-4 py-2 bg-white text-plum rounded-full font-ui text-xs font-semibold hover:bg-lilac-soft cursor-pointer transition-colors border-none"
          @click="triggerFileInput"
        >
          Trocar imagem
        </button>
        <button
          type="button"
          class="px-4 py-2 bg-plum text-white rounded-full font-ui text-xs font-semibold hover:bg-plum-muted cursor-pointer transition-colors border-none"
          @click="removeImage"
        >
          Remover
        </button>
      </div>
    </div>

    <!-- Upload Placeholder when empty -->
    <div
      v-else
      class="w-full border-2 border-dashed border-line rounded-2xl p-6 md:p-8 text-center bg-white hover:border-lilac cursor-pointer transition-colors flex flex-col items-center justify-center gap-2 group"
      @click="triggerFileInput"
    >
      <div class="w-12 h-12 rounded-full bg-lilac-soft text-lilac flex items-center justify-center group-hover:scale-105 transition-transform">
        <svg
          class="w-6 h-6"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
          <circle cx="9" cy="9" r="2" />
          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
        </svg>
      </div>
      <div class="flex flex-col gap-0.5">
        <span class="font-ui text-sm font-medium text-plum">
          Clique para enviar imagem ou arraste até aqui
        </span>
        <span class="font-ui text-xs text-plum-muted">
          Formatos aceitos: PNG, JPG ou WEBP (até 5MB)
        </span>
      </div>
    </div>
  </div>
</template>
