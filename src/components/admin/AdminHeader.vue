<script setup>
import { ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import logo from '../../assets/Logo.svg'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const menuOpen = ref(false)

const items = [
  { label: 'Produtos', to: '/admin/produtos' },
  { label: 'Catálogo', to: '/admin/catalogo' },
  { label: 'Vendas', to: '/admin/vendas' },
]

const isActive = (item) => route.path.startsWith(item.to)
const initials = 'KG'

function logout() {
  menuOpen.value = false
  auth.logout()
  router.replace({ name: 'login', query: { reason: 'logout' } })
}
</script>

<template>
  <header>
    <div class="border-b border-line bg-white">
      <div class="container relative">
        <div class="flex h-[72px] items-center justify-between gap-4 md:h-[88px]">
          <div class="flex items-center gap-3">
            <RouterLink to="/admin/produtos" class="inline-flex" aria-label="Painel Karol Glow">
              <img :src="logo" alt="Karol Glow" class="h-[38px] w-auto" />
            </RouterLink>
            <span class="rounded-full bg-plum px-3.5 py-1.5 font-ui text-xs font-semibold leading-[1.3] text-white">Painel</span>
          </div>

          <nav class="hidden items-center gap-8 md:flex" aria-label="Painel">
            <RouterLink
              v-for="i in items"
              :key="i.to"
              :to="i.to"
              class="font-ui text-base leading-[1.3] no-underline"
              :class="isActive(i) ? 'font-semibold text-plum' : 'font-normal text-plum-muted hover:text-plum'"
            >{{ i.label }}</RouterLink>
          </nav>

          <div class="flex items-center gap-3 md:gap-4">
            <RouterLink to="/" class="hidden font-ui text-sm font-medium text-plum underline md:inline">Ver site</RouterLink>
            <span class="grid size-10 place-items-center rounded-full bg-lilac-soft font-ui text-[13px] font-semibold text-plum" aria-hidden="true">{{ initials }}</span>
            <span class="hidden font-ui text-sm text-plum lg:inline">Administradora</span>
            <button
              type="button"
              class="hidden h-9 cursor-pointer rounded-full border border-line bg-white px-4 font-ui text-sm font-medium text-plum hover:border-plum md:block"
              :title="auth.email"
              @click="logout"
            >Sair</button>
            <button
              type="button"
              class="grid size-11 cursor-pointer place-items-center rounded-full border border-line bg-white p-0 text-plum md:hidden"
              :aria-expanded="menuOpen"
              aria-label="Menu"
              @click="menuOpen = !menuOpen"
            >
              <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true">
                <path v-if="!menuOpen" d="M4 7h16M4 12h16M4 17h16" />
                <path v-else d="m6 6 12 12M18 6 6 18" />
              </svg>
            </button>
          </div>
        </div>

        <div v-if="menuOpen" class="absolute right-4 top-[68px] z-40 flex w-48 flex-col rounded-2xl border border-line bg-white p-2 shadow-lg md:hidden">
          <RouterLink to="/" class="rounded-xl px-3 py-2.5 font-ui text-sm text-plum no-underline hover:bg-lilac-soft" @click="menuOpen = false">Ver site</RouterLink>
          <button type="button" class="cursor-pointer rounded-xl border-0 bg-transparent px-3 py-2.5 text-left font-ui text-sm text-plum hover:bg-lilac-soft" @click="logout">Sair</button>
        </div>
      </div>
    </div>

    <nav class="container flex gap-2 overflow-x-auto py-3 md:hidden" aria-label="Painel (mobile)">
      <RouterLink
        v-for="i in items"
        :key="i.to"
        :to="i.to"
        class="shrink-0 rounded-full px-6 py-3 font-ui text-base font-medium no-underline"
        :class="isActive(i) ? 'bg-plum text-white' : 'border border-line bg-white text-plum'"
      >{{ i.label }}</RouterLink>
    </nav>
  </header>
</template>
