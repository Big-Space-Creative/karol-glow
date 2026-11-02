<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { safeRedirect } from '../services/auth'
import { useAuthStore } from '../stores/auth'
import logo from '../assets/Logo.svg'
import BaseButton from '../components/BaseButton.vue'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const now = ref(Date.now())
let timer

onMounted(() => {
  timer = setInterval(() => (now.value = Date.now()), 1000)
})
onBeforeUnmount(() => clearInterval(timer))

const remaining = computed(() => Math.max(0, Math.ceil((auth.lockedUntil - now.value) / 1000)))
const locked = computed(() => remaining.value > 0)
const countdown = computed(() => {
  const m = Math.floor(remaining.value / 60)
  const s = String(remaining.value % 60).padStart(2, '0')
  return `${m}:${s}`
})

const notice = computed(() => {
  if (route.query.reason === 'expired') return 'Sua sessão expirou. Entre novamente para continuar.'
  if (route.query.reason === 'logout') return 'Você saiu do painel.'
  return ''
})

async function submit() {
  if (locked.value || auth.loading) return
  const ok = await auth.login(email.value, password.value)
  password.value = ''
  if (ok) router.replace(safeRedirect(route.query.redirect))
}
</script>

<template>
  <main class="grid min-h-screen place-items-center bg-white px-4 py-12">
    <div class="w-full max-w-[440px]">
      <RouterLink to="/" class="mb-10 flex justify-center" aria-label="Voltar ao site">
        <img :src="logo" alt="Karol Glow" class="h-[38px] w-auto" />
      </RouterLink>

      <div class="rounded-[32px] border-2 border-lilac-soft bg-white p-8 md:p-10">
        <p class="m-0 font-ui text-sm font-semibold leading-[1.3] tracking-[0.04em] text-lilac">Área administrativa</p>
        <h1 class="m-0 mt-3 font-display text-[40px] font-light leading-[1.1] tracking-[-0.02em]">Entrar</h1>
        <p class="m-0 mt-3 font-ui text-sm leading-normal text-plum-muted">Acesse o painel para gerenciar produtos, catálogo e vendas.</p>

        <p v-if="notice" class="m-0 mt-6 rounded-2xl bg-lilac-soft px-4 py-3 font-ui text-sm text-plum" role="status">{{ notice }}</p>

        <form class="mt-8 flex flex-col gap-5" novalidate @submit.prevent="submit">
          <label class="flex flex-col gap-2 font-ui text-[13px] font-semibold text-plum">
            E-mail
            <input
              v-model="email"
              type="email"
              name="email"
              autocomplete="username"
              inputmode="email"
              required
              maxlength="254"
              :disabled="locked || auth.loading"
              class="h-12 rounded-xl border border-line bg-white px-4 font-ui text-sm font-normal text-plum outline-none transition-colors placeholder:text-plum-muted focus:border-plum disabled:opacity-60"
              placeholder="voce@exemplo.com"
            />
          </label>

          <label class="flex flex-col gap-2 font-ui text-[13px] font-semibold text-plum">
            Senha
            <span class="relative block">
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                name="password"
                autocomplete="current-password"
                required
                maxlength="128"
                :disabled="locked || auth.loading"
                class="h-12 w-full rounded-xl border border-line bg-white pl-4 pr-12 font-ui text-sm font-normal text-plum outline-none transition-colors placeholder:text-plum-muted focus:border-plum disabled:opacity-60"
                placeholder="Sua senha"
              />
              <button
                type="button"
                class="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 cursor-pointer place-items-center rounded-full border-0 bg-transparent p-0 text-plum-muted hover:text-plum"
                :aria-label="showPassword ? 'Ocultar senha' : 'Mostrar senha'"
                :aria-pressed="showPassword"
                @click="showPassword = !showPassword"
              >
                <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                  <circle cx="12" cy="12" r="3" />
                  <path v-if="showPassword" d="M4 20 20 4" />
                </svg>
              </button>
            </span>
          </label>

          <p v-if="locked" class="m-0 rounded-2xl bg-lilac-soft px-4 py-3 font-ui text-sm text-plum" role="alert">
            Muitas tentativas. Tente novamente em <strong>{{ countdown }}</strong>.
          </p>
          <p v-else-if="auth.error" class="m-0 font-ui text-sm text-[#b3261e]" role="alert">
            {{ auth.error }}
            <span v-if="auth.attemptsLeft < 3 && auth.attemptsLeft > 0"> ({{ auth.attemptsLeft }} tentativa{{ auth.attemptsLeft > 1 ? 's' : '' }} restante{{ auth.attemptsLeft > 1 ? 's' : '' }})</span>
          </p>
          <p v-if="!auth.configured" class="m-0 font-ui text-sm text-[#b3261e]" role="alert">
            Acesso administrativo não configurado. Defina as variáveis VITE_ADMIN_* (veja .env.example).
          </p>

          <BaseButton type="submit" block :disabled="locked || auth.loading || !email || !password">
            {{ auth.loading ? 'Verificando…' : 'Entrar' }}
          </BaseButton>
        </form>
      </div>

      <p class="mt-8 text-center font-ui text-sm">
        <RouterLink to="/" class="text-plum-muted underline">← Voltar ao site</RouterLink>
      </p>
    </div>
  </main>
</template>
