<script setup>
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { useProductsStore } from '../stores/products'
import AppHeader from '../components/AppHeader.vue'
import AppFooter from '../components/AppFooter.vue'

const store = useProductsStore()
onMounted(() => store.loadPublic())
</script>

<template>
  <div class="flex min-h-screen flex-col bg-white">
    <div class="container">
      <AppHeader />
    </div>

    <p v-if="store.error" class="container m-0 py-3 text-center font-ui text-sm text-[#b3261e]" role="alert">
      Não foi possível carregar os produtos. Atualize a página em instantes.
    </p>

    <main class="w-full flex-1">
      <RouterView />
    </main>

    <div class="container pt-[120px] pb-10">
      <AppFooter />
    </div>
  </div>
</template>
