<script setup>
import { computed, ref } from 'vue'
import { errorMessage } from '../../services/api'
import { useProductsStore } from '../../stores/products'
import AdminPageHeader from '../../components/admin/AdminPageHeader.vue'
import BaseButton from '../../components/BaseButton.vue'
import Toast from '../../components/admin/Toast.vue'

const store = useProductsStore()

// Inputs
const newCategory = ref('')
const newBrand = ref('')
const newSkinType = ref('')
const newVariationType = ref('')

// Tipos de variação com as opções já usadas nos produtos (as opções são definidas em cada produto)
const variationGroups = computed(() =>
  store.catalog.variationTypes.map((t) => {
    const labels = new Set()
    let count = 0
    for (const p of store.items) for (const v of p.variations || []) if (v.typeId === t.id) { labels.add(v.label); count++ }
    return { id: t.id, name: t.name, count, options: [...labels] }
  }),
)

// Toast
const toast = ref({ show: false, message: '' })

function showToast(message) {
  toast.value = { show: true, message }
  setTimeout(() => {
    toast.value.show = false
  }, 3000)
}

const countOf = (list, name) => list.find((x) => x.name === name)?.productCount ?? 0
const getCategoryCount = (cat) => countOf(store.catalog.categories, cat)
const getBrandCount = (brand) => countOf(store.catalog.brands, brand)
const getSkinTypeCount = (st) => countOf(store.catalog.skinTypes, st)

// Cria um item e mostra o resultado (o servidor recusa nomes repetidos)
async function add(kind, value, label, reset) {
  const val = value.trim()
  if (!val) return
  try {
    await store.addCatalogItem(kind, val)
    reset()
    await store.loadCatalog()
    showToast(`${label} "${val}" adicionado(a) com sucesso.`)
  } catch (err) {
    showToast(err.status === 409 ? `"${val}" já existe.` : errorMessage(err))
  }
}

async function remove(kind, name, label) {
  if (!confirm(`Tem certeza que deseja remover "${name}"?`)) return
  try {
    await store.removeCatalogItem(kind, name)
    showToast(`${label} "${name}" removido(a).`)
  } catch (err) {
    showToast(errorMessage(err))
  }
}

const handleAddCategory = () => add('categories', newCategory.value, 'Categoria', () => (newCategory.value = ''))
const handleRemoveCategory = (cat) => remove('categories', cat, 'Categoria')
const handleAddBrand = () => add('brands', newBrand.value, 'Marca', () => (newBrand.value = ''))
const handleRemoveBrand = (brand) => remove('brands', brand, 'Marca')
const handleAddSkinType = () => add('skinTypes', newSkinType.value, 'Tipo de pele', () => (newSkinType.value = ''))
const handleRemoveSkinType = (st) => remove('skinTypes', st, 'Tipo de pele')
const handleAddVariationGroup = () => add('variationTypes', newVariationType.value, 'Tipo de variação', () => (newVariationType.value = ''))
const handleRemoveVariationGroup = (index) => remove('variationTypes', variationGroups.value[index].name, 'Tipo de variação')

function addOptionToGroup(group) {
  showToast(`As opções de ${group.name} (ex.: 30 ml, 50 ml) são definidas no cadastro de cada produto.`)
}
</script>

<template>
  <div class="bg-white min-h-full pb-20">
    <!-- AdminPageHeader oficial -->
    <AdminPageHeader
      eyebrow="Painel"
      title="Catálogo"
      description="Gerencie as opções usadas no cadastro de produtos e nos filtros do site."
    />

    <!-- Aviso abaixo do header (como no Figma) -->
    <p class="font-ui text-xs text-plum-muted m-0 -mt-4 mb-8">
      Itens com produtos vinculados só podem ser excluídos depois que os produtos forem movidos para outro item.
    </p>

    <!-- Grid 2x2 de Cards -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- 1. Categorias -->
      <div class="bg-white border-2 border-lilac-soft rounded-3xl p-8 flex flex-col justify-between">
        <div>
          <h2 class="font-display text-[28px] font-normal text-plum m-0">
            Categorias
          </h2>
          <p class="font-ui text-xs text-plum-muted leading-relaxed m-0 mt-2">
            Aparece no cadastro, nos filtros em pill do site e na seção "Produtos" da Home. Arraste para definir a ordem de exibição.
          </p>

          <!-- Input + Botão Adicionar -->
          <div class="mt-6 mb-6">
            <label class="font-ui text-[13px] font-semibold text-plum block mb-2">
              Nova categoria
            </label>
            <form class="flex items-center gap-3" @submit.prevent="handleAddCategory">
              <input
                v-model="newCategory"
                type="text"
                placeholder="Ex.: Unhas"
                class="flex-1 h-12 px-4 rounded-xl border border-line bg-white font-ui text-sm text-plum placeholder:text-plum-muted focus:outline-none focus:border-plum"
              />
              <BaseButton variant="primary" type="submit">
                Adicionar
              </BaseButton>
            </form>
          </div>

          <!-- Lista de Categorias -->
          <div class="divide-y divide-line">
            <div
              v-for="cat in store.categories"
              :key="cat"
              class="py-4 flex items-center justify-between group"
            >
              <div class="flex items-center gap-3">
                <!-- 6 dots grip -->
                <svg
                  class="w-4 h-4 text-plum-muted/60 cursor-grab shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <circle cx="9" cy="5" r="1" />
                  <circle cx="9" cy="12" r="1" />
                  <circle cx="9" cy="19" r="1" />
                  <circle cx="15" cy="5" r="1" />
                  <circle cx="15" cy="12" r="1" />
                  <circle cx="15" cy="19" r="1" />
                </svg>
                <div>
                  <p class="font-ui text-base font-normal text-plum m-0">
                    {{ cat }}
                  </p>
                  <p class="font-ui text-xs text-plum-muted m-0 mt-0.5">
                    {{ getCategoryCount(cat) }} produtos
                  </p>
                </div>
              </div>

              <div class="flex items-center gap-3 text-plum-muted">
                <button
                  type="button"
                  class="p-1.5 hover:text-plum transition-colors border-none bg-transparent cursor-pointer"
                  title="Editar"
                >
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                  </svg>
                </button>
                <button
                  type="button"
                  class="p-1.5 hover:text-plum transition-colors border-none bg-transparent cursor-pointer"
                  title="Excluir"
                  @click="handleRemoveCategory(cat)"
                >
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 2. Marcas -->
      <div class="bg-white border-2 border-lilac-soft rounded-3xl p-8 flex flex-col justify-between">
        <div>
          <h2 class="font-display text-[28px] font-normal text-plum m-0">
            Marcas
          </h2>
          <p class="font-ui text-xs text-plum-muted leading-relaxed m-0 mt-2">
            Aparece no cadastro e no filtro "Marca" do site, em ordem alfabética.
          </p>

          <!-- Input + Botão Adicionar -->
          <div class="mt-6 mb-6">
            <label class="font-ui text-[13px] font-semibold text-plum block mb-2">
              Nova marca
            </label>
            <form class="flex items-center gap-3" @submit.prevent="handleAddBrand">
              <input
                v-model="newBrand"
                type="text"
                placeholder="Nome da marca"
                class="flex-1 h-12 px-4 rounded-xl border border-line bg-white font-ui text-sm text-plum placeholder:text-plum-muted focus:outline-none focus:border-plum"
              />
              <BaseButton variant="primary" type="submit">
                Adicionar
              </BaseButton>
            </form>
          </div>

          <!-- Lista de Marcas (sem grip, em ordem alfabética como no Figma) -->
          <div class="divide-y divide-line">
            <div
              v-for="brand in store.brands"
              :key="brand"
              class="py-4 flex items-center justify-between group"
            >
              <div>
                <p class="font-ui text-base font-normal text-plum m-0">
                  {{ brand }}
                </p>
                <p class="font-ui text-xs text-plum-muted m-0 mt-0.5">
                  {{ getBrandCount(brand) }} produtos
                </p>
              </div>

              <div class="flex items-center gap-3 text-plum-muted">
                <button
                  type="button"
                  class="p-1.5 hover:text-plum transition-colors border-none bg-transparent cursor-pointer"
                  title="Editar"
                >
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                  </svg>
                </button>
                <button
                  type="button"
                  class="p-1.5 hover:text-plum transition-colors border-none bg-transparent cursor-pointer"
                  title="Excluir"
                  @click="handleRemoveBrand(brand)"
                >
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 3. Tipos de pele -->
      <div class="bg-white border-2 border-lilac-soft rounded-3xl p-8 flex flex-col justify-between">
        <div>
          <h2 class="font-display text-[28px] font-normal text-plum m-0">
            Tipos de pele
          </h2>
          <p class="font-ui text-xs text-plum-muted leading-relaxed m-0 mt-2">
            Aparece no cadastro e no filtro "Tipo de pele" do site.
          </p>

          <!-- Input + Botão Adicionar -->
          <div class="mt-6 mb-6">
            <label class="font-ui text-[13px] font-semibold text-plum block mb-2">
              Novo tipo de pele
            </label>
            <form class="flex items-center gap-3" @submit.prevent="handleAddSkinType">
              <input
                v-model="newSkinType"
                type="text"
                placeholder="Ex.: Acneica"
                class="flex-1 h-12 px-4 rounded-xl border border-line bg-white font-ui text-sm text-plum placeholder:text-plum-muted focus:outline-none focus:border-plum"
              />
              <BaseButton variant="primary" type="submit">
                Adicionar
              </BaseButton>
            </form>
          </div>

          <!-- Lista de Tipos de Pele -->
          <div class="divide-y divide-line">
            <div
              v-for="st in store.skinTypes"
              :key="st"
              class="py-4 flex items-center justify-between group"
            >
              <div>
                <p class="font-ui text-base font-normal text-plum m-0">
                  {{ st }}
                </p>
                <p class="font-ui text-xs text-plum-muted m-0 mt-0.5">
                  {{ getSkinTypeCount(st) }} produtos
                </p>
              </div>

              <div class="flex items-center gap-3 text-plum-muted">
                <button
                  type="button"
                  class="p-1.5 hover:text-plum transition-colors border-none bg-transparent cursor-pointer"
                  title="Editar"
                >
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                  </svg>
                </button>
                <button
                  type="button"
                  class="p-1.5 hover:text-plum transition-colors border-none bg-transparent cursor-pointer"
                  title="Excluir"
                  @click="handleRemoveSkinType(st)"
                >
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 4. Tipos de variação -->
      <div class="bg-white border-2 border-lilac-soft rounded-3xl p-8 flex flex-col justify-between">
        <div>
          <h2 class="font-display text-[28px] font-normal text-plum m-0">
            Tipos de variação
          </h2>
          <p class="font-ui text-xs text-plum-muted leading-relaxed m-0 mt-2">
            Define as opções disponíveis no card "Variações" do cadastro e o seletor na página do produto.
          </p>

          <!-- Input + Botão Adicionar -->
          <div class="mt-6 mb-6">
            <label class="font-ui text-[13px] font-semibold text-plum block mb-2">
              Novo tipo de variação
            </label>
            <form class="flex items-center gap-3" @submit.prevent="handleAddVariationGroup">
              <input
                v-model="newVariationType"
                type="text"
                placeholder="Ex.: Fragrância"
                class="flex-1 h-12 px-4 rounded-xl border border-line bg-white font-ui text-sm text-plum placeholder:text-plum-muted focus:outline-none focus:border-plum"
              />
              <BaseButton variant="primary" type="submit">
                Adicionar
              </BaseButton>
            </form>
          </div>

          <!-- Lista de Grupos de Variação (com opções em pills como no Figma) -->
          <div class="divide-y divide-line">
            <div
              v-for="(group, index) in variationGroups"
              :key="group.name"
              class="py-5 flex flex-col gap-3"
            >
              <!-- Linha superior com Nome e Ações -->
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="font-ui text-base font-normal text-plum">
                    {{ group.name }}
                  </span>
                  <span class="font-ui text-xs text-plum-muted">
                    · {{ group.count }} produtos
                  </span>
                </div>

                <div class="flex items-center gap-3 text-plum-muted">
                  <button
                    type="button"
                    class="p-1.5 hover:text-plum transition-colors border-none bg-transparent cursor-pointer"
                    title="Editar"
                  >
                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    class="p-1.5 hover:text-plum transition-colors border-none bg-transparent cursor-pointer"
                    title="Excluir"
                    @click="handleRemoveVariationGroup(index)"
                  >
                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </div>

              <!-- Linha inferior com Pills de valores e botão + Opção -->
              <div class="flex flex-wrap items-center gap-2">
                <span
                  v-for="opt in group.options"
                  :key="opt"
                  class="inline-flex items-center h-8 px-4 rounded-full border border-line bg-white font-ui text-xs font-medium text-plum"
                >
                  {{ opt }}
                </span>
                <button
                  type="button"
                  class="inline-flex items-center h-8 px-4 rounded-full border border-dashed border-lilac bg-white text-lilac font-ui text-xs font-medium hover:bg-lilac-soft/30 cursor-pointer transition-colors"
                  @click="addOptionToGroup(group)"
                >
                  + Opção
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <Toast
      :show="toast.show"
      :message="toast.message"
      @close="toast.show = false"
    />
  </div>
</template>
