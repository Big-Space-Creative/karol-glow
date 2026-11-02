<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useProductsStore } from '../../stores/products'
import AdminPageHeader from '../../components/admin/AdminPageHeader.vue'
import BaseButton from '../../components/BaseButton.vue'
import BaseChip from '../../components/BaseChip.vue'
import Toast from '../../components/admin/Toast.vue'

const route = useRoute()
const router = useRouter()
const store = useProductsStore()

const isEditing = computed(() => Boolean(route.params.id))
const productId = computed(() => route.params.id)

const form = ref({
  name: '',
  description: '',
  category: '',
  brand: '',
  skinTypes: ['Todos os tipos'],
  price: '',
  promoPrice: '',
  stock: '',
  sku: '',
  hasVariations: true,
  variationType: 'Tamanho',
  variations: [
    { value: '30 ml', price: '89,90', stock: '24', sku: 'KG-0001-30' },
    { value: '50 ml', price: '119,90', stock: '12', sku: 'KG-0001-50' },
  ],
  image: '',
  active: true,
  bestSeller: false,
  featured: false,
  isNew: true,
})

const fileInput = ref(null)
const toast = ref({ show: false, message: '' })

function showToast(message) {
  toast.value = { show: true, message }
  setTimeout(() => {
    toast.value.show = false
  }, 3000)
}

onMounted(() => {
  if (isEditing.value) {
    const existing = store.byId(productId.value)
    if (existing) {
      form.value.name = existing.name || ''
      form.value.description = existing.description || ''
      form.value.category = existing.category || ''
      form.value.brand = existing.brand || ''
      form.value.price = existing.price ? String(existing.price).replace('.', ',') : ''
      form.value.stock = existing.stock !== undefined ? String(existing.stock) : ''
      form.value.sku = `KG-${String(existing.id).padStart(4, '0')}`
      form.value.active = existing.active !== undefined ? existing.active : true
      form.value.bestSeller = Boolean(existing.bestSeller)
      form.value.featured = Boolean(existing.featured)
      form.value.isNew = existing.tag === 'Novo'
      form.value.image = existing.image || ''
      if (existing.skinType) {
        form.value.skinTypes = [existing.skinType]
      }
    } else {
      router.replace('/admin/produtos')
    }
  } else {
    form.value.category = store.categories[0] || 'Rosto'
    form.value.brand = store.brands[0] || 'Marca 01'
    const nextId = store.items.length ? Math.max(...store.items.map((i) => Number(i.id) || 0)) + 1 : 1
    form.value.sku = `KG-${String(nextId).padStart(4, '0')}`
  }
})

function toggleSkinType(st) {
  if (st === 'Todos os tipos') {
    form.value.skinTypes = ['Todos os tipos']
    return
  }
  form.value.skinTypes = form.value.skinTypes.filter((t) => t !== 'Todos os tipos')
  if (form.value.skinTypes.includes(st)) {
    form.value.skinTypes = form.value.skinTypes.filter((t) => t !== st)
    if (form.value.skinTypes.length === 0) {
      form.value.skinTypes = ['Todos os tipos']
    }
  } else {
    form.value.skinTypes.push(st)
  }
}

function addVariationRow() {
  form.value.variations.push({
    value: '',
    price: form.value.price || '',
    stock: '10',
    sku: `${form.value.sku || 'KG-0001'}-${form.value.variations.length + 1}`,
  })
}

function removeVariationRow(index) {
  form.value.variations.splice(index, 1)
}

function triggerUpload() {
  fileInput.value?.click()
}

function handleFile(e) {
  const file = e.target.files?.[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (ev) => {
      form.value.image = ev.target.result
    }
    reader.readAsDataURL(file)
  }
}

function handleSave() {
  if (!form.value.name.trim()) {
    alert('Por favor, preencha o nome do produto.')
    return
  }

  const numericPrice = parseFloat(String(form.value.price).replace(',', '.')) || 0
  const numericStock = parseInt(form.value.stock, 10) || 0

  let tag = ''
  if (form.value.isNew) tag = 'Novo'
  else if (form.value.bestSeller) tag = 'Mais vendido'

  const productData = {
    name: form.value.name,
    description: form.value.description,
    category: form.value.category || store.categories[0] || 'Rosto',
    brand: form.value.brand || store.brands[0] || 'Marca 01',
    skinType: form.value.skinTypes.join(', '),
    price: numericPrice,
    stock: numericStock,
    tag,
    active: form.value.active,
    bestSeller: form.value.bestSeller,
    featured: form.value.featured,
    image: form.value.image,
  }

  if (isEditing.value) {
    store.updateProduct(productId.value, productData)
  } else {
    store.addProduct(productData)
  }

  router.push('/admin/produtos')
}

function handleDelete() {
  if (confirm(`Tem certeza que deseja excluir "${form.value.name}"?`)) {
    store.deleteProduct(productId.value)
    router.push('/admin/produtos')
  }
}
</script>

<template>
  <div class="bg-white min-h-full pb-20">
    <!-- Breadcrumb -->
    <div class="flex items-center gap-1.5 font-ui text-sm text-plum-muted pt-6">
      <RouterLink to="/admin/produtos" class="hover:text-plum transition-colors no-underline">
        Produtos
      </RouterLink>
      <span>/</span>
      <span class="text-plum font-medium">
        {{ isEditing ? 'Editar produto' : 'Novo produto' }}
      </span>
    </div>

    <!-- AdminPageHeader oficial -->
    <AdminPageHeader
      :eyebrow="isEditing ? 'Edição' : 'Cadastro'"
      :title="isEditing ? (form.name || 'Editar produto') : 'Novo produto'"
      description="Preencha as informações para publicar o produto no catálogo."
    >
      <template #actions>
        <RouterLink to="/admin/produtos" class="no-underline">
          <BaseButton variant="secondary">Cancelar</BaseButton>
        </RouterLink>
        <BaseButton variant="primary" @click="handleSave">Salvar produto</BaseButton>
      </template>
    </AdminPageHeader>

    <!-- Formulário em 2 colunas -->
    <form class="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4" @submit.prevent="handleSave">
      <!-- Coluna Esquerda: Informações básicas, Preço e estoque, Variações (8 cols) -->
      <div class="lg:col-span-8 flex flex-col gap-8">
        <!-- 1. Card Informações básicas -->
        <div class="bg-white border-2 border-lilac-soft rounded-3xl p-8 space-y-6">
          <h2 class="font-display text-[28px] font-normal text-plum m-0">
            Informações básicas
          </h2>

          <!-- Nome do produto -->
          <div>
            <label class="font-ui text-[13px] font-semibold text-plum block mb-2">
              Nome do produto
            </label>
            <input
              v-model="form.name"
              type="text"
              placeholder="Ex.: Sérum facial iluminador"
              class="w-full h-12 px-4 rounded-xl border border-line bg-white font-ui text-sm text-plum placeholder:text-plum-muted focus:outline-none focus:border-plum"
              required
            />
          </div>

          <!-- Descrição -->
          <div>
            <label class="font-ui text-[13px] font-semibold text-plum block mb-2">
              Descrição
            </label>
            <textarea
              v-model="form.description"
              rows="4"
              placeholder="Descreva o produto, seus benefícios e modo de uso..."
              class="w-full p-4 rounded-xl border border-line bg-white font-ui text-sm text-plum placeholder:text-plum-muted focus:outline-none focus:border-plum resize-y"
            ></textarea>
          </div>

          <!-- Categoria e Marca -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label class="font-ui text-[13px] font-semibold text-plum block mb-2">
                Categoria
              </label>
              <div class="relative">
                <select
                  v-model="form.category"
                  class="w-full h-12 px-4 pr-10 rounded-xl border border-line bg-white font-ui text-sm text-plum appearance-none cursor-pointer focus:outline-none focus:border-plum"
                >
                  <option value="" disabled>Selecione</option>
                  <option v-for="c in store.categories" :key="c" :value="c">
                    {{ c }}
                  </option>
                </select>
                <svg
                  class="w-4 h-4 text-plum absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </div>

            <div>
              <label class="font-ui text-[13px] font-semibold text-plum block mb-2">
                Marca
              </label>
              <div class="relative">
                <select
                  v-model="form.brand"
                  class="w-full h-12 px-4 pr-10 rounded-xl border border-line bg-white font-ui text-sm text-plum appearance-none cursor-pointer focus:outline-none focus:border-plum"
                >
                  <option value="" disabled>Selecione</option>
                  <option v-for="b in store.brands" :key="b" :value="b">
                    {{ b }}
                  </option>
                </select>
                <svg
                  class="w-4 h-4 text-plum absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </div>
          </div>

          <!-- Link gerenciar -->
          <div>
            <RouterLink
              to="/admin/catalogo"
              class="font-ui text-sm font-medium text-plum underline hover:text-lilac transition-colors"
            >
              Gerenciar categorias e marcas no Catálogo
            </RouterLink>
          </div>

          <!-- Tipo de pele -->
          <div>
            <label class="font-ui text-[13px] font-semibold text-plum block mb-2">
              Tipo de pele
            </label>
            <div class="flex flex-wrap gap-2.5">
              <BaseChip
                v-for="st in ['Todos os tipos', 'Seca', 'Oleosa', 'Mista', 'Sensível']"
                :key="st"
                :label="st"
                :active="form.skinTypes.includes(st)"
                type="button"
                @click="toggleSkinType(st)"
              />
            </div>
            <p class="font-ui text-xs text-plum-muted m-0 mt-2">
              Selecione um ou mais. Alimenta o filtro "Tipo de pele" do site.
            </p>
          </div>
        </div>

        <!-- 2. Card Preço e estoque -->
        <div class="bg-white border-2 border-lilac-soft rounded-3xl p-8 space-y-6">
          <div>
            <h2 class="font-display text-[28px] font-normal text-plum m-0">
              Preço e estoque
            </h2>
            <p class="font-ui text-xs text-plum-muted m-0 mt-1">
              Se o produto tiver variações, o preço e o estoque de cada variação substituem estes valores.
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label class="font-ui text-[13px] font-semibold text-plum block mb-2">
                Preço (R$)
              </label>
              <input
                v-model="form.price"
                type="text"
                placeholder="0,00"
                class="w-full h-12 px-4 rounded-xl border border-line bg-white font-ui text-sm text-plum placeholder:text-plum-muted focus:outline-none focus:border-plum"
              />
            </div>

            <div>
              <label class="font-ui text-[13px] font-semibold text-plum block mb-2">
                Preço promocional (R$)
              </label>
              <input
                v-model="form.promoPrice"
                type="text"
                placeholder="Opcional"
                class="w-full h-12 px-4 rounded-xl border border-line bg-white font-ui text-sm text-plum placeholder:text-plum-muted focus:outline-none focus:border-plum"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label class="font-ui text-[13px] font-semibold text-plum block mb-2">
                Estoque (unidades)
              </label>
              <input
                v-model="form.stock"
                type="number"
                placeholder="0"
                class="w-full h-12 px-4 rounded-xl border border-line bg-white font-ui text-sm text-plum placeholder:text-plum-muted focus:outline-none focus:border-plum"
              />
            </div>

            <div>
              <label class="font-ui text-[13px] font-semibold text-plum block mb-2">
                SKU
              </label>
              <input
                v-model="form.sku"
                type="text"
                placeholder="Ex.: KG-0001"
                class="w-full h-12 px-4 rounded-xl border border-line bg-white font-ui text-sm text-plum placeholder:text-plum-muted focus:outline-none focus:border-plum"
              />
            </div>
          </div>
        </div>

        <!-- 3. Card Variações -->
        <div class="bg-white border-2 border-lilac-soft rounded-3xl p-8 space-y-6">
          <div>
            <h2 class="font-display text-[28px] font-normal text-plum m-0">
              Variações
            </h2>
            <p class="font-ui text-xs text-plum-muted m-0 mt-1">
              Use quando o produto tiver opções, como tamanho ou cor. Cada variação tem preço, estoque e SKU próprios.
            </p>
          </div>

          <!-- Toggle variações -->
          <div class="flex items-center justify-between py-2">
            <span class="font-ui text-sm font-medium text-plum">
              Este produto tem variações
            </span>
            <button
              type="button"
              role="switch"
              :aria-checked="form.hasVariations"
              class="w-12 h-6.5 rounded-full transition-colors duration-200 relative p-0.5 border-none cursor-pointer"
              :class="form.hasVariations ? 'bg-plum' : 'bg-line'"
              @click="form.hasVariations = !form.hasVariations"
            >
              <span
                class="block w-5 h-5 bg-white rounded-full shadow transition-transform duration-200"
                :class="form.hasVariations ? 'translate-x-5.5' : 'translate-x-0.5'"
              />
            </button>
          </div>

          <!-- Conteúdo expandido de variações -->
          <div v-if="form.hasVariations" class="space-y-6 pt-2">
            <div>
              <label class="font-ui text-[13px] font-semibold text-plum block mb-2">
                Tipo de variação
              </label>
              <div class="relative max-w-sm">
                <select
                  v-model="form.variationType"
                  class="w-full h-12 px-4 pr-10 rounded-xl border border-line bg-white font-ui text-sm text-plum appearance-none cursor-pointer focus:outline-none focus:border-plum"
                >
                  <option v-for="t in store.variationTypes" :key="t" :value="t">
                    {{ t }}
                  </option>
                </select>
                <svg
                  class="w-4 h-4 text-plum absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </div>

            <div>
              <RouterLink
                to="/admin/catalogo"
                class="font-ui text-sm font-medium text-plum underline hover:text-lilac transition-colors"
              >
                Gerenciar tipos de variação no Catálogo
              </RouterLink>
            </div>

            <!-- Tabela de Variações -->
            <div class="space-y-3">
              <div class="grid grid-cols-[1.5fr_1fr_0.8fr_1.5fr_auto] gap-3 font-ui text-[13px] font-semibold text-plum px-1">
                <span>Variação</span>
                <span>Preço (R$)</span>
                <span>Estoque</span>
                <span>SKU</span>
                <span class="w-8"></span>
              </div>

              <div
                v-for="(v, index) in form.variations"
                :key="index"
                class="grid grid-cols-[1.5fr_1fr_0.8fr_1.5fr_auto] gap-3 items-center"
              >
                <input
                  v-model="v.value"
                  type="text"
                  placeholder="Ex.: 30 ml"
                  class="w-full h-11 px-4 rounded-xl border border-line bg-white font-ui text-sm text-plum focus:outline-none focus:border-plum"
                />
                <input
                  v-model="v.price"
                  type="text"
                  placeholder="0,00"
                  class="w-full h-11 px-4 rounded-xl border border-line bg-white font-ui text-sm text-plum focus:outline-none focus:border-plum"
                />
                <input
                  v-model="v.stock"
                  type="number"
                  placeholder="0"
                  class="w-full h-11 px-4 rounded-xl border border-line bg-white font-ui text-sm text-plum focus:outline-none focus:border-plum"
                />
                <input
                  v-model="v.sku"
                  type="text"
                  placeholder="SKU"
                  class="w-full h-11 px-4 rounded-xl border border-line bg-white font-ui text-sm text-plum focus:outline-none focus:border-plum"
                />
                <button
                  type="button"
                  class="w-8 h-8 rounded-lg flex items-center justify-center text-plum-muted hover:text-plum hover:bg-lilac-soft transition-colors border-none bg-transparent cursor-pointer"
                  title="Excluir variação"
                  @click="removeVariationRow(index)"
                >
                  <svg
                    class="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            </div>

            <div>
              <button
                type="button"
                class="inline-flex items-center gap-2 h-10 px-5 rounded-full border border-line bg-white font-ui text-sm font-medium text-plum hover:bg-lilac-soft cursor-pointer transition-colors"
                @click="addVariationRow"
              >
                <span class="text-base font-normal">+</span>
                <span>Adicionar variação</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Coluna Direita: Imagens, Status, Destaques (4 cols, 1 card contínuo como no PNG) -->
      <div class="lg:col-span-4">
        <div class="bg-white border-2 border-lilac-soft rounded-3xl p-8 space-y-8 sticky top-24">
          <!-- 1. Imagens -->
          <div class="space-y-3">
            <div>
              <h2 class="font-display text-[28px] font-normal text-plum m-0">
                Imagens
              </h2>
              <p class="font-ui text-xs text-plum-muted m-0 mt-1">
                A primeira imagem será a capa do produto.
              </p>
            </div>

            <input
              ref="fileInput"
              type="file"
              accept="image/*"
              class="hidden"
              @change="handleFile"
            />

            <!-- Preview se existir imagem -->
            <div
              v-if="form.image"
              class="relative w-full h-44 rounded-2xl overflow-hidden border border-line group flex items-center justify-center bg-lilac-soft/20"
            >
              <img :src="form.image" alt="Preview" class="w-full h-full object-contain" />
              <div class="absolute inset-0 bg-plum-muted/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  type="button"
                  class="px-3 py-1.5 rounded-full bg-white text-plum font-ui text-xs font-semibold cursor-pointer border-none"
                  @click="triggerUpload"
                >
                  Trocar
                </button>
                <button
                  type="button"
                  class="px-3 py-1.5 rounded-full bg-plum text-white font-ui text-xs font-semibold cursor-pointer border-none"
                  @click="form.image = ''"
                >
                  Remover
                </button>
              </div>
            </div>

            <!-- Upload Area pontilhada estilo PNG -->
            <div
              v-else
              class="rounded-2xl border-2 border-dashed border-lilac bg-white p-7 text-center cursor-pointer flex flex-col items-center justify-center gap-2 transition-colors hover:bg-lilac-soft/20"
              @click="triggerUpload"
            >
              <div class="w-10 h-10 rounded-xl bg-lilac-soft/60 flex items-center justify-center text-lilac">
                <svg
                  class="w-6 h-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.6"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </div>
              <p class="font-ui text-xs font-semibold text-plum m-0 mt-1">
                Arraste as imagens ou clique para enviar
              </p>
              <p class="font-ui text-[11px] text-plum-muted m-0">
                PNG ou JPG, até 5 MB
              </p>
            </div>
          </div>

          <!-- 2. Status -->
          <div class="space-y-3 pt-2 border-t border-line">
            <h2 class="font-display text-[28px] font-normal text-plum m-0">
              Status
            </h2>
            <div class="flex items-center justify-between">
              <div>
                <p class="font-ui text-sm font-medium text-plum m-0">
                  Produto ativo
                </p>
                <p class="font-ui text-xs text-plum-muted m-0 mt-0.5">
                  Produtos inativos não aparecem no site.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                :aria-checked="form.active"
                class="w-12 h-6.5 rounded-full transition-colors duration-200 relative p-0.5 border-none cursor-pointer shrink-0"
                :class="form.active ? 'bg-plum' : 'bg-line'"
                @click="form.active = !form.active"
              >
                <span
                  class="block w-5 h-5 bg-white rounded-full shadow transition-transform duration-200"
                  :class="form.active ? 'translate-x-5.5' : 'translate-x-0.5'"
                />
              </button>
            </div>
          </div>

          <!-- 3. Destaques -->
          <div class="space-y-4 pt-2 border-t border-line">
            <div>
              <h2 class="font-display text-[28px] font-normal text-plum m-0">
                Destaques
              </h2>
              <p class="font-ui text-xs text-plum-muted m-0 mt-1">
                Etiquetas e seções em que o produto aparece no site.
              </p>
            </div>

            <div class="space-y-3">
              <!-- Mais vendido -->
              <label class="flex items-center gap-3 cursor-pointer select-none">
                <input
                  v-model="form.bestSeller"
                  type="checkbox"
                  class="hidden"
                />
                <div
                  class="w-5 h-5 rounded-md border flex items-center justify-center transition-colors"
                  :class="form.bestSeller ? 'bg-plum border-plum text-white' : 'bg-white border-line text-transparent'"
                >
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span class="font-ui text-sm font-medium text-plum">
                  Mais vendido
                </span>
              </label>

              <!-- Em destaque -->
              <label class="flex items-center gap-3 cursor-pointer select-none">
                <input
                  v-model="form.featured"
                  type="checkbox"
                  class="hidden"
                />
                <div
                  class="w-5 h-5 rounded-md border flex items-center justify-center transition-colors"
                  :class="form.featured ? 'bg-plum border-plum text-white' : 'bg-white border-line text-transparent'"
                >
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span class="font-ui text-sm font-medium text-plum">
                  Em destaque
                </span>
              </label>

              <!-- Novo -->
              <label class="flex items-center gap-3 cursor-pointer select-none">
                <input
                  v-model="form.isNew"
                  type="checkbox"
                  class="hidden"
                />
                <div
                  class="w-5 h-5 rounded-md border flex items-center justify-center transition-colors"
                  :class="form.isNew ? 'bg-plum border-plum text-white' : 'bg-white border-line text-transparent'"
                >
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span class="font-ui text-sm font-medium text-plum">
                  Novo
                </span>
              </label>
            </div>
          </div>

          <!-- Zona de exclusão quando editando -->
          <div v-if="isEditing" class="pt-4 border-t border-line">
            <button
              type="button"
              class="w-full h-11 px-4 rounded-xl border border-line text-plum-muted hover:text-white hover:bg-plum hover:border-plum transition-all font-ui text-xs font-semibold uppercase tracking-wider cursor-pointer"
              @click="handleDelete"
            >
              Excluir produto
            </button>
          </div>
        </div>
      </div>
    </form>

    <!-- Mobile Fixed Action Bar -->
    <div class="fixed md:hidden bottom-0 left-0 right-0 p-4 bg-white border-t border-line z-30 flex items-center gap-3 shadow-lg">
      <RouterLink to="/admin/produtos" class="flex-1 no-underline">
        <BaseButton variant="secondary" block>Cancelar</BaseButton>
      </RouterLink>
      <BaseButton variant="primary" class="flex-1" @click="handleSave">
        Salvar
      </BaseButton>
    </div>

    <!-- Toast -->
    <Toast
      :show="toast.show"
      :message="toast.message"
      @close="toast.show = false"
    />
  </div>
</template>
