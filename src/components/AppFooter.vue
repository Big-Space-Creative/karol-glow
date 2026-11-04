<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import logoClaro from '../assets/Logo claro.svg'
import { useSettingsStore } from '../stores/settings'
import { DEFAULT_MESSAGE, formatPhone, whatsappUrl } from '../services/whatsapp'

const year = new Date().getFullYear()
const settings = useSettingsStore()

const wa = (text) => whatsappUrl(settings.phone, text)

const columns = computed(() => [
  {
    title: 'Navegação',
    links: [
      { label: 'Início', to: '/' },
      { label: 'Sobre', to: { path: '/', hash: '#sobre' } },
      { label: 'Mais vendidos', to: { path: '/', hash: '#mais-vendidos' } },
      { label: 'Produtos', to: '/produtos' },
    ],
  },
  {
    title: 'Ajuda',
    links: [
      { label: 'Envio e entregas', href: wa('Olá! Gostaria de saber como funcionam o envio e as entregas.') },
      { label: 'Trocas e devoluções', href: wa('Olá! Gostaria de saber como funcionam as trocas e devoluções.') },
      { label: 'Perguntas frequentes', href: wa('Olá! Tenho uma dúvida sobre os produtos.') },
    ],
  },
  {
    title: 'Contato',
    links: [
      { label: formatPhone(settings.phone), href: wa(DEFAULT_MESSAGE) },
      { label: settings.email, href: `mailto:${settings.email}` },
      { label: `@${settings.instagram}`, href: settings.instagramUrl },
    ],
  },
])
</script>

<template>
  <footer id="contato" class="flex flex-col gap-12 rounded-3xl bg-plum px-6 pt-10 pb-8 md:rounded-[32px] text-lilac-soft md:px-14 md:pt-14">
    <div class="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
      <div class="flex w-full max-w-[340px] flex-col gap-5">
        <img :src="logoClaro" alt="Karol Glow" class="h-[38px] w-[118px]" />
        <p class="m-0 font-ui text-sm leading-normal">
          Produtos pensados para realçar o seu brilho natural, com cuidado em cada detalhe.
        </p>
        <div class="flex gap-2.5">
          <a :href="settings.instagramUrl" target="_blank" rel="noopener noreferrer" aria-label="Instagram" class="grid size-11 place-items-center rounded-full border border-line bg-white text-plum">
            <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
              <rect x="4" y="4" width="16" height="16" rx="5" />
              <circle cx="12" cy="12" r="3.5" />
              <circle cx="16.8" cy="7.2" r=".8" fill="currentColor" />
            </svg>
          </a>
          <a :href="wa(DEFAULT_MESSAGE)" target="_blank" rel="noopener noreferrer" aria-label="Telefone e WhatsApp" class="grid size-11 place-items-center rounded-full border border-line bg-white text-plum">
            <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M6.5 4h3l1.5 4-2 1.5a11 11 0 0 0 5.5 5.5L16 13l4 1.5v3a2 2 0 0 1-2 2A14 14 0 0 1 4.5 6a2 2 0 0 1 2-2Z" />
            </svg>
          </a>
          <a :href="`mailto:${settings.email}`" aria-label="E-mail" class="grid size-11 place-items-center rounded-full border border-line bg-white text-plum">
            <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
              <path d="m4 7 8 6 8-6" />
            </svg>
          </a>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-x-8 gap-y-8 md:flex md:flex-wrap md:gap-x-[72px]">
        <div v-for="col in columns" :key="col.title" class="flex flex-col gap-3.5">
          <p class="m-0 font-ui text-[13px] font-semibold leading-[1.3] text-white">{{ col.title }}</p>
          <template v-for="l in col.links" :key="l.label">
            <RouterLink v-if="l.to" :to="l.to" class="font-ui text-sm leading-normal text-lilac-soft no-underline hover:text-white">{{ l.label }}</RouterLink>
            <a
              v-else
              :href="l.href"
              :target="l.href.startsWith('mailto:') ? undefined : '_blank'"
              rel="noopener noreferrer"
              class="break-all font-ui text-sm leading-normal text-lilac-soft no-underline hover:text-white"
            >{{ l.label }}</a>
          </template>
        </div>
      </div>
    </div>

    <div class="h-px w-full bg-white/12" />

    <p class="m-0 font-ui text-xs leading-[1.3]">© {{ year }} Karol Glow. Todos os direitos reservados.</p>
  </footer>
</template>
