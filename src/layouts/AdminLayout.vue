<script setup>
import { RouterView } from 'vue-router'
import AdminHeader from '../components/admin/AdminHeader.vue'
</script>

<template>
  <div class="flex min-h-screen flex-col bg-white font-ui text-plum">
    <AdminHeader />
    <main class="container w-full flex-1 pb-16">
      <RouterView />
    </main>
  </div>
</template>
