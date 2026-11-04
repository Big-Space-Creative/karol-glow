<script setup>
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { errorMessage } from '../../services/api'
import { useProductsStore } from '../../stores/products'
import AdminPageHeader from '../../components/admin/AdminPageHeader.vue'
import PillSelect from '../../components/admin/PillSelect.vue'
import Toast from '../../components/admin/Toast.vue'
import BaseButton from '../../components/BaseButton.vue'
import BaseChip from '../../components/BaseChip.vue'
import Pagination from '../../components/Pagination.vue'
import SearchField from '../../components/SearchField.vue'

const store = useProductsStore()
const PER_PAGE = 6

const search = ref('')
const category = ref('')
const status = ref('')
const chip = ref('Todos')
const sort = ref('recent')
const page = ref(1)
const toast = ref({ show: false, message: '' })

const sku = (p) => `KG-${String(p.id).padStart(4, '0')}`
const brl = (v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const categoryOptions = computed(() => [{ label: 'Todas', value: '' }, ...store.categories.map((c) => ({ label: c, value: c }))])
const statusOptions = [
  { label: 'Todos', value: '' },
  { label: 'Ativos', value: 'active' },
  { label: 'Inativos', value: 'inactive' },
]
const sortOptions = [
  { label: 'Mais recentes', value: 'recent' },
  { label: 'Nome (A-Z)', value: 'name' },
  { label: 'Menor preço', value: 'low' },
  { label: 'Maior preço', value: 'high' },
  { label: 'Menor estoque', value: 'stock' },
]

const filtered = computed(() => {
  let list = [...store.items]
  const q = search.value.trim().toLowerCase()
  if (q) list = list.filter((p) => p.name.toLowerCase().includes(q) || sku(p).toLowerCase().includes(q))
  if (category.value) list = list.filter((p) => p.category === category.value)
  if (status.value === 'active') list = list.filter((p) => p.active)
  if (status.value === 'inactive') list = list.filter((p) => !p.active)
  if (chip.value === 'Mais vendidos') list = list.filter((p) => p.bestSeller)
  if (chip.value === 'Em destaque') list = list.filter((p) => p.featured)
  const sorters = {
    recent: (a, b) => b.id - a.id,
    name: (a, b) => a.name.localeCompare(b.name),
    low: (a, b) => a.price - b.price,
    high: (a, b) => b.price - a.price,
    stock: (a, b) => a.stock - b.stock,
  }
  return list.sort(sorters[sort.value])
})

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / PER_PAGE)))
const rows = computed(() => filtered.value.slice((page.value - 1) * PER_PAGE, page.value * PER_PAGE))
const from = computed(() => (filtered.value.length ? (page.value - 1) * PER_PAGE + 1 : 0))
const to = computed(() => Math.min(page.value * PER_PAGE, filtered.value.length))

watch([search, category, status, chip, sort], () => (page.value = 1))

async function remove(p) {
  if (!confirm(`Tem certeza que deseja excluir "${p.name}"?`)) return
  try {
    await store.deleteProduct(p.id)
    toast.value = { show: true, message: `Produto "${p.name}" excluído com sucesso.` }
  } catch (err) {
    // produto com vendas não pode ser apagado: o servidor explica e a pessoa pode inativá-lo
    toast.value = { show: true, message: err.status === 409 ? `"${p.name}" tem vendas registradas e não pode ser excluído. Desative-o no cadastro.` : errorMessage(err) }
  }
  setTimeout(() => (toast.value.show = false), 3000)
  if (page.value > totalPages.value) page.value = totalPages.value
}
</script>

<template>
  <div>
    <AdminPageHeader title="Produtos" description="Cadastre, edite e remova os produtos exibidos no site.">
      <template #actions>
        <RouterLink to="/admin/produtos/novo" class="w-full md:w-auto"><BaseButton class="w-full md:w-auto">Novo produto</BaseButton></RouterLink>
      </template>
    </AdminPageHeader>

    <!-- Filtros (desktop) -->
    <div class="hidden flex-col gap-4 pt-2 md:flex">
      <div class="flex items-center gap-3">
        <SearchField v-model="search" placeholder="Buscar por nome ou SKU" class="md:!w-[320px]" />
        <PillSelect v-model="category" label="Categoria:" :options="categoryOptions" />
        <PillSelect v-model="status" label="Status:" :options="statusOptions" />
        <p class="m-0 ml-auto font-ui text-sm text-plum-muted">{{ store.items.length }} produtos cadastrados</p>
      </div>
      <div class="flex items-center justify-between">
        <div class="flex gap-2">
          <BaseChip v-for="c in ['Todos', 'Mais vendidos', 'Em destaque']" :key="c" :label="c" :active="chip === c" @click="chip = c" />
        </div>
        <PillSelect v-model="sort" label="Ordenar por:" :options="sortOptions" />
      </div>
    </div>

    <!-- Filtros (mobile) -->
    <div class="flex flex-col gap-3 md:hidden">
      <SearchField v-model="search" placeholder="Buscar por nome ou SKU" />
      <div class="grid grid-cols-2 gap-3">
        <PillSelect v-model="category" label="Categoria:" :options="categoryOptions" class="min-w-0" />
        <PillSelect v-model="status" label="Status:" :options="statusOptions" class="min-w-0" />
      </div>
      <div class="-mx-4 flex gap-2 overflow-x-auto px-4">
        <BaseChip v-for="c in ['Todos', 'Mais vendidos', 'Em destaque']" :key="c" :label="c" :active="chip === c" @click="chip = c" />
      </div>
      <PillSelect v-model="sort" label="Ordenar por:" :options="sortOptions" />
      <p class="m-0 pt-1 font-ui text-sm text-plum-muted">{{ store.items.length }} produtos cadastrados</p>
    </div>

    <!-- Tabela (desktop) -->
    <div class="mt-10 hidden md:block">
      <div class="grid grid-cols-[minmax(0,2.6fr)_1fr_0.8fr_0.8fr_1fr_0.9fr] items-center rounded-xl border-2 border-lilac-soft px-4 py-3.5 font-ui text-[11px] font-semibold uppercase tracking-[0.15em] text-plum-muted">
        <span>Produto</span><span>Categoria</span><span>Preço</span><span>Estoque</span><span>Status</span><span class="text-right">Ações</span>
      </div>
      <div
        v-for="p in rows"
        :key="p.id"
        class="grid grid-cols-[minmax(0,2.6fr)_1fr_0.8fr_0.8fr_1fr_0.9fr] items-center border-b border-line px-4 py-3.5 font-ui text-base text-plum"
      >
        <div class="flex min-w-0 items-center gap-3.5">
          <div class="grid size-[52px] shrink-0 place-items-center rounded-xl border-[1.5px] border-dashed border-lilac bg-lilac-soft text-lilac">
            <svg class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="1.5" /><path d="m21 16-5-5-8 8" /></svg>
          </div>
          <div class="min-w-0">
            <p class="m-0 truncate text-lg leading-[1.3]">{{ p.name }}</p>
            <p class="m-0 text-xs text-plum-muted">SKU {{ sku(p) }}</p>
          </div>
        </div>
        <span>{{ p.category }}</span>
        <span>{{ brl(p.price) }}</span>
        <span>{{ p.stock }} un.</span>
        <span>
          <span
            class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
            :class="p.active ? 'bg-lilac-soft text-plum' : 'bg-line text-plum-muted'"
          >
            <span class="size-1.5 rounded-full" :class="p.active ? 'bg-lilac' : 'bg-plum-muted'" />{{ p.active ? 'Ativo' : 'Inativo' }}
          </span>
        </span>
        <div class="flex items-center justify-end gap-4 text-plum">
          <RouterLink :to="`/produtos/${p.id}`" class="grid size-6 place-items-center" :aria-label="`Ver ${p.name} no site`">
            <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg>
          </RouterLink>
          <RouterLink :to="`/admin/produtos/${p.id}`" class="grid size-6 place-items-center" :aria-label="`Editar ${p.name}`">
            <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4Z" /><path d="m13.5 6.5 4 4" /></svg>
          </RouterLink>
          <button type="button" class="grid size-6 cursor-pointer place-items-center border-0 bg-transparent p-0 text-plum" :aria-label="`Excluir ${p.name}`" @click="remove(p)">
            <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></svg>
          </button>
        </div>
      </div>
      <p v-if="!rows.length" class="py-16 text-center font-ui text-plum-muted">Nenhum produto encontrado.</p>
      <div class="flex items-center justify-between px-4 pt-6">
        <p class="m-0 font-ui text-sm text-plum-muted">Mostrando {{ from }}–{{ to }} de {{ filtered.length }}</p>
        <Pagination v-model:current-page="page" :total-pages="totalPages" />
      </div>
    </div>

    <!-- Lista (mobile) -->
    <div class="mt-4 flex flex-col md:hidden">
      <div v-for="p in rows" :key="p.id" class="flex flex-col px-2 pb-1 pt-5">
        <div class="flex items-center gap-4 pb-4">
          <div class="grid size-[52px] shrink-0 place-items-center rounded-xl border-[1.5px] border-dashed border-lilac bg-lilac-soft text-lilac">
            <svg class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="1.5" /><path d="m21 16-5-5-8 8" /></svg>
          </div>
          <div class="min-w-0 flex-1">
            <p class="m-0 truncate font-ui text-base leading-[1.3] text-plum">{{ p.name }}</p>
            <p class="m-0 mt-1 font-ui text-xs text-plum-muted">SKU {{ sku(p) }} · {{ p.category }}</p>
          </div>
          <span
            class="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 font-ui text-xs font-semibold"
            :class="p.active ? 'bg-lilac-soft text-plum' : 'bg-line text-plum-muted'"
          ><span class="size-1.5 rounded-full" :class="p.active ? 'bg-lilac' : 'bg-plum-muted'" />{{ p.active ? 'Ativo' : 'Inativo' }}</span>
        </div>
        <div class="flex items-center justify-between border-t border-line py-4 font-ui text-sm text-plum">
          <span class="flex items-center gap-2"><span class="font-semibold">{{ brl(p.price) }}</span><span class="text-plum-muted">· {{ p.stock }} un.</span></span>
          <span class="flex items-center gap-5">
            <RouterLink :to="`/produtos/${p.id}`" class="grid size-6 place-items-center" :aria-label="`Ver ${p.name} no site`">
              <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg>
            </RouterLink>
            <RouterLink :to="`/admin/produtos/${p.id}`" class="grid size-6 place-items-center" :aria-label="`Editar ${p.name}`">
              <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4Z" /><path d="m13.5 6.5 4 4" /></svg>
            </RouterLink>
            <button type="button" class="grid size-6 cursor-pointer place-items-center border-0 bg-transparent p-0 text-plum" :aria-label="`Excluir ${p.name}`" @click="remove(p)">
              <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></svg>
            </button>
          </span>
        </div>
      </div>
      <p v-if="!rows.length" class="py-10 text-center font-ui text-plum-muted">Nenhum produto encontrado.</p>
      <div class="flex justify-center pt-6"><Pagination v-model:current-page="page" :total-pages="totalPages" /></div>
    </div>

    <Toast :show="toast.show" :message="toast.message" @close="toast.show = false" />
  </div>
</template>
