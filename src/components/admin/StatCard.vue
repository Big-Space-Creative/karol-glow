<script setup>
defineProps({
  title: {
    type: String,
    required: true,
  },
  value: {
    type: [String, Number],
    required: true,
  },
  subtitle: {
    type: String,
    default: '',
  },
  trend: {
    type: String,
    default: '',
  },
  trendUp: {
    type: Boolean,
    default: true,
  },
})
</script>

<template>
  <div class="bg-white border border-line rounded-2xl p-6 flex flex-col justify-between transition-all duration-200 hover:border-lilac">
    <div class="flex items-center justify-between gap-2">
      <span class="font-ui text-xs font-semibold uppercase tracking-wider text-plum-muted">
        {{ title }}
      </span>
      <div v-if="$slots.icon" class="text-lilac">
        <slot name="icon" />
      </div>
    </div>

    <div class="mt-2">
      <span class="font-display text-3xl md:text-4xl font-light text-plum block">
        {{ value }}
      </span>
      <div v-if="subtitle || trend" class="flex items-center gap-2 mt-2">
        <span
          v-if="trend"
          class="font-ui text-xs font-semibold px-2 py-0.5 rounded-full"
          :class="[
            trendUp
              ? 'bg-lilac-soft text-plum'
              : 'bg-line text-plum-muted',
          ]"
        >
          {{ trend }}
        </span>
        <span v-if="subtitle" class="font-ui text-xs text-plum-muted">
          {{ subtitle }}
        </span>
      </div>
    </div>
  </div>
</template>
