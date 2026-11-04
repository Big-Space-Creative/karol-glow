<script setup>
import { onMounted, ref } from 'vue'
import { errorMessage } from '../../services/api'
import { formatPhone } from '../../services/whatsapp'
import { useSettingsStore } from '../../stores/settings'
import AdminPageHeader from '../../components/admin/AdminPageHeader.vue'
import BaseInput from '../../components/admin/BaseInput.vue'
import BaseButton from '../../components/BaseButton.vue'
import Toast from '../../components/admin/Toast.vue'

const settings = useSettingsStore()

const form = ref({ email: '', phone: '', instagram: '', shipping: '' })
const saving = ref(false)
const loadError = ref('')
const toast = ref({ show: false, message: '' })

function showToast(message) {
  toast.value = { show: true, message }
  setTimeout(() => (toast.value.show = false), 3500)
}

function fill() {
  form.value = { email: settings.email, phone: formatPhone(settings.phone), instagram: settings.instagram, shipping: settings.shipping }
}

onMounted(async () => {
  try {
    await settings.loadAdmin()
    fill()
  } catch (err) {
    loadError.value = errorMessage(err)
  }
})

async function save() {
  saving.value = true
  try {
    await settings.save({ ...form.value })
    fill() // mostra como o servidor guardou (telefone formatado, @ removido etc.)
    showToast('Informações salvas.')
  } catch (err) {
    showToast(errorMessage(err))
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="pb-16">
    <AdminPageHeader
      title="Contato e envio"
      description="O contato aparece no rodapé do site, e o telefone também é o WhatsApp que recebe os pedidos da sacola. O texto de envio e trocas aparece em todos os produtos."
    />

    <p v-if="loadError" class="m-0 py-3 font-ui text-sm text-[#b3261e]" role="alert">{{ loadError }}</p>

    <form class="flex max-w-[560px] flex-col gap-6 rounded-3xl border border-line bg-white p-6 md:p-8" @submit.prevent="save">
      <BaseInput v-model="form.email" label="E-mail" type="email" placeholder="contato@exemplo.com" required />
      <div class="flex flex-col gap-1.5">
        <BaseInput v-model="form.phone" label="Telefone / WhatsApp" type="tel" placeholder="(88) 99404-5293" required />
        <p class="m-0 font-ui text-xs text-plum-muted">Com DDD. Se não informar o código do país, usamos +55 (Brasil).</p>
      </div>
      <div class="flex flex-col gap-1.5">
        <BaseInput v-model="form.instagram" label="Instagram" placeholder="karolglow.oficial99" prefix="@" required />
        <p class="m-0 font-ui text-xs text-plum-muted">Só o nome de usuário (pode colar o link do perfil).</p>
      </div>
      <div class="flex flex-col gap-1.5">
        <label class="font-ui text-xs font-semibold uppercase tracking-wider text-plum-muted">Envio e trocas</label>
        <textarea
          v-model="form.shipping"
          rows="4"
          maxlength="1500"
          placeholder="Ex.: prazo de entrega, formas de envio e política de trocas."
          class="w-full rounded-xl border border-line bg-white p-4 font-ui text-[15px] text-plum placeholder:text-plum-muted focus:border-plum focus:outline-none resize-y"
        ></textarea>
        <p class="m-0 font-ui text-xs text-plum-muted">Deixe em branco para não mostrar esse bloco no site.</p>
      </div>
      <div>
        <BaseButton type="submit" :disabled="saving">{{ saving ? 'Salvando…' : 'Salvar alterações' }}</BaseButton>
      </div>
    </form>

    <Toast :show="toast.show" :message="toast.message" />
  </div>
</template>
