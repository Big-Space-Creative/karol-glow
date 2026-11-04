<script setup>
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { useProductsStore } from '../stores/products'
import AdminHeader from '../components/admin/AdminHeader.vue'

const store = useProductsStore()
onMounted(() => store.loadAdmin())
</script>

<template>
  <div class="flex min-h-screen flex-col bg-white font-ui text-plum">
    <AdminHeader />
    <main class="container w-full flex-1 pb-16">
      <p v-if="store.error" class="m-0 py-3 font-ui text-sm text-[#b3261e]" role="alert">{{ store.error }}</p>
      <RouterView v-if="store.loaded" />
      <p v-else-if="!store.error" class="m-0 py-16 text-center font-ui text-sm text-plum-muted">Carregando…</p>
    </main>
  </div>
</template>
