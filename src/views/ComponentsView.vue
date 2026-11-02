<script setup>
import { ref } from 'vue'
import AccordionItem from '../components/AccordionItem.vue'
import BaseButton from '../components/BaseButton.vue'
import BaseChip from '../components/BaseChip.vue'
import BaseTag from '../components/BaseTag.vue'
import CategoryItem from '../components/CategoryItem.vue'
import FeatureCard from '../components/FeatureCard.vue'
import Pagination from '../components/Pagination.vue'
import ProductCard from '../components/ProductCard.vue'
import ProductCardCompact from '../components/ProductCardCompact.vue'
import QuantityStepper from '../components/QuantityStepper.vue'
import SearchField from '../components/SearchField.vue'
import SectionTitle from '../components/SectionTitle.vue'

const categories = ['Rosto', 'Corpo', 'Cabelo', 'Maquiagem', 'Kits']
const activeCategory = ref('Rosto')
const activeChip = ref('Todos')
const quantity = ref(1)
const search = ref('')
const page = ref(1)

const products = [
  { id: 1, name: 'Sérum Iluminador', brand: 'Marca 01', price: 129.9, tag: 'Novo' },
  { id: 2, name: 'Hidratante Facial', brand: 'Marca 02', price: 89.9, tag: 'Mais vendido' },
  { id: 3, name: 'Máscara de Cílios', brand: 'Marca 03', price: 59.9 },
  { id: 4, name: 'Óleo Corporal', brand: 'Marca 01', price: 74.9 },
]
</script>

<template>
  <div class="container py-16 space-y-20">
    <header>
      <SectionTitle eyebrow="Design system" title="Componentes" subtitle="Todos os componentes de src/components, com estados e variações." />
    </header>

    <section class="space-y-6">
      <h2 class="text-3xl">Botões</h2>
      <div class="flex flex-wrap items-center gap-4">
        <BaseButton>Primário</BaseButton>
        <BaseButton variant="secondary">Secundário</BaseButton>
        <BaseButton disabled>Desabilitado</BaseButton>
      </div>
      <BaseButton block>Botão largura total</BaseButton>
    </section>

    <section class="space-y-6">
      <h2 class="text-3xl">Tags e chips</h2>
      <div class="flex flex-wrap gap-3">
        <BaseTag text="Plum" variant="plum" />
        <BaseTag text="Lilac" variant="lilac" />
        <BaseTag text="Soft" variant="soft" />
        <BaseTag text="Outline" variant="outline" />
      </div>
      <div class="flex flex-wrap gap-3">
        <BaseChip v-for="c in ['Todos', ...categories]" :key="c" :label="c" :active="activeChip === c" @click="activeChip = c" />
        <BaseChip label="Desabilitado" disabled />
      </div>
    </section>

    <section class="space-y-6">
      <h2 class="text-3xl">Títulos de seção</h2>
      <SectionTitle eyebrow="Mais vendidos" title="Os queridinhos do momento" />
      <SectionTitle eyebrow="Centralizado" title="Onde a sua beleza floresce" align="center" />
    </section>

    <section class="space-y-6">
      <h2 class="text-3xl">Categorias</h2>
      <div class="max-w-[440px]">
        <CategoryItem v-for="c in categories" :key="c" :name="c" :count="12" :active="activeCategory === c" @click="activeCategory = c" />
      </div>
    </section>

    <section class="space-y-6">
      <h2 class="text-3xl">Cards de produto</h2>
      <div class="flex flex-wrap gap-4">
        <ProductCard v-for="p in products" :key="p.id" v-bind="p" />
      </div>
      <h3 class="text-2xl">Compacto</h3>
      <div class="flex flex-wrap gap-4">
        <ProductCardCompact v-for="p in products" :key="p.id" v-bind="p" />
      </div>
    </section>

    <section class="space-y-6">
      <h2 class="text-3xl">Feature cards</h2>
      <div class="flex flex-wrap gap-4">
        <FeatureCard title="Cuidado que se vê" description="Fórmulas pensadas para a rotina real." badge="01" />
        <FeatureCard title="Pele radiante" description="Resultado que aparece no espelho." badge="02" />
      </div>
    </section>

    <section class="space-y-6">
      <h2 class="text-3xl">Formulário</h2>
      <div class="max-w-[420px] space-y-6">
        <SearchField v-model="search" />
        <div class="flex items-center gap-4">
          <QuantityStepper v-model="quantity" :min="1" :max="10" />
          <span class="text-plum-muted">Quantidade: {{ quantity }}</span>
        </div>
      </div>
    </section>

    <section class="space-y-6">
      <h2 class="text-3xl">Acordeão</h2>
      <div class="max-w-[608px]">
        <AccordionItem title="Modo de uso" default-open>Aplique sobre a pele limpa, pela manhã e à noite.</AccordionItem>
        <AccordionItem title="Ingredientes">Lista de ingredientes do produto.</AccordionItem>
        <AccordionItem title="Envio e trocas">Informações sobre prazo, frete e trocas.</AccordionItem>
      </div>
    </section>

    <section class="space-y-6">
      <h2 class="text-3xl">Paginação</h2>
      <Pagination v-model:current-page="page" :total-pages="8" />
    </section>
  </div>
</template>
