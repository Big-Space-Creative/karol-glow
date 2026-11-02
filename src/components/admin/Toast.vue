<script setup>
defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  message: {
    type: String,
    default: '',
  },
  type: {
    type: String,
    default: 'success',
  },
})

defineEmits(['close'])
</script>

<template>
  <transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="transform translate-y-4 opacity-0"
    enter-to-class="transform translate-y-0 opacity-100"
    leave-active-class="transition duration-200 ease-in"
    leave-from-class="transform translate-y-0 opacity-100"
    leave-to-class="transform translate-y-4 opacity-0"
  >
    <div
      v-if="show"
      class="fixed bottom-6 right-6 z-50 max-w-[90vw] bg-plum text-white shadow-2xl rounded-full px-5 py-3.5 flex items-center gap-3 font-ui text-sm font-medium"
      role="alert"
    >
      <div class="w-6 h-6 rounded-full bg-lilac/30 text-lilac flex items-center justify-center shrink-0">
        <svg
          class="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>

      <span class="truncate">{{ message }}</span>

      <button
        type="button"
        class="text-white/70 hover:text-white p-1 -mr-1 rounded-full cursor-pointer transition-colors border-none bg-transparent"
        aria-label="Fechar notificação"
        @click="$emit('close')"
      >
        <svg
          class="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  </transition>
</template>
