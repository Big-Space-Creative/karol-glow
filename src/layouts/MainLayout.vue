<script setup>
import { RouterView } from 'vue-router'
import AppHeader from '../components/AppHeader.vue'
import AppFooter from '../components/AppFooter.vue'
</script>

<template>
  <div class="flex min-h-screen flex-col bg-white">
    <div class="container">
      <AppHeader />
    </div>

    <main class="w-full flex-1">
      <RouterView />
    </main>

    <div class="container pt-[120px] pb-10">
      <AppFooter />
    </div>
  </div>
</template>
