<script setup>
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useProductsStore } from '../stores/products'
import hero from '../assets/images/hero-home.png'
import cardCuidado from '../assets/images/card-cuidado.png'
import categoriaRosto from '../assets/images/categoria-rosto.png'
import symbol from '../assets/Icon.svg'
import BaseButton from '../components/BaseButton.vue'
import CategoryFeatureCard from '../components/CategoryFeatureCard.vue'
import CategoryItem from '../components/CategoryItem.vue'
import FeatureCard from '../components/FeatureCard.vue'
import ImageCard from '../components/ImageCard.vue'
import ProductCard from '../components/ProductCard.vue'
import ProductCardCompact from '../components/ProductCardCompact.vue'
import SectionTitle from '../components/SectionTitle.vue'

const store = useProductsStore()
const activeCategory = ref('Rosto')

// O Figma só traz a foto da categoria Rosto; as demais reutilizam a mesma até haver imagens.
const categoryText = {
  Rosto: 'Limpeza, hidratação e tratamento para uma pele com aparência saudável e iluminada todos os dias.',
  Corpo: 'Hidratação, esfoliação e cuidado para uma pele macia e radiante da cabeça aos pés.',
  Cabelo: 'Nutrição e brilho para fios fortes, saudáveis e cheios de vida.',
  Maquiagem: 'Cor e acabamento sofisticados para realçar o seu estilo, do dia à noite.',
  Kits: 'Combinações pensadas para facilitar a sua rotina de cuidados.',
}
const categoryDescription = computed(() => categoryText[activeCategory.value])
</script>

<template>
  <div class="container">
    <!-- 01 · Home -->
    <section id="inicio" class="relative flex min-h-[640px] items-end overflow-hidden rounded-3xl md:block md:h-[680px] md:rounded-[32px]">
      <img :src="hero" alt="" class="absolute inset-0 size-full object-cover" />
      <div class="relative mx-auto flex w-full max-w-full flex-col items-center gap-[22px] px-6 pb-6 text-center md:pb-0 md:pt-20">
        <img :src="symbol" alt="" class="h-12 w-auto" />
        <h1 class="m-0 font-display text-[44px] font-light leading-[1.05] tracking-[-0.02em] text-plum md:text-[76px]">
          Onde a sua beleza floresce
        </h1>
        <p class="m-0 max-w-[600px] font-ui text-base leading-normal text-plum-muted md:text-lg">
          Produtos pensados para realçar o seu brilho natural, com cuidado em cada detalhe — do ingrediente à embalagem.
        </p>
        <div class="flex w-full flex-wrap justify-center gap-3 md:w-auto">
          <RouterLink to="/produtos" class="w-full md:w-auto"><BaseButton icon class="w-full md:w-auto">Ver produtos</BaseButton></RouterLink>
          <RouterLink :to="{ path: '/', hash: '#sobre' }" class="hidden md:block"><BaseButton variant="secondary">Conheça a marca</BaseButton></RouterLink>
        </div>
      </div>
    </section>

    <!-- 02 · Sobre -->
    <section id="sobre" class="flex scroll-mt-4 flex-col gap-10 pt-16 md:gap-14 md:pt-[140px]">
      <div class="flex flex-col justify-between gap-8 md:flex-row md:items-start">
        <div class="flex flex-col items-start gap-7">
          <SectionTitle eyebrow="Sobre nós" title="O que é a Karol Glow?" />
          <RouterLink to="/produtos"><BaseButton icon>Conheça nossa história</BaseButton></RouterLink>
        </div>
        <p class="m-0 font-ui text-xl leading-[1.44] text-plum md:w-[540px] md:text-2xl">
          A Karol Glow nasceu para tornar o autocuidado simples e prazeroso, com produtos que valorizam a beleza de cada pessoa.
        </p>
      </div>
      <div class="flex flex-col gap-4 md:flex-row">
        <ImageCard
          class="md:shrink-0"
          :image="cardCuidado"
          title="Cuidado que se vê"
          description="Fórmulas pensadas para a rotina real: fáceis de usar e com resultado que aparece no espelho."
        />
        <FeatureCard
          class="md:min-w-px md:flex-1"
          :title="'Feito com\ncarinho'"
          description="Cada produto é escolhido e testado antes de chegar até você."
        />
        <FeatureCard
          class="md:min-w-px md:flex-1"
          :title="'Atendimento\npróximo'"
          description="Tire dúvidas e receba indicações personalizadas para a sua rotina."
        />
      </div>
    </section>

    <!-- 03 · Mais vendidos -->
    <section id="mais-vendidos" class="flex scroll-mt-4 flex-col gap-8 pt-16 md:gap-12 md:pt-[140px]">
      <div class="flex items-end justify-between">
        <SectionTitle eyebrow="Os favoritos" title="Mais vendidos" />
        <RouterLink to="/produtos" class="hidden md:block"><BaseButton variant="secondary" icon>Ver todos</BaseButton></RouterLink>
        <RouterLink to="/produtos" class="pb-2 font-ui text-sm font-medium text-plum underline md:hidden">Ver todos</RouterLink>
      </div>
      <div class="hidden gap-4 md:flex">
        <ProductCard
          v-for="p in store.bestSellers"
          :key="p.id"
          v-bind="p"
          :category="p.category"
          :description="p.description"
        />
      </div>
      <div class="grid grid-cols-2 justify-items-center gap-4 md:hidden">
        <ProductCardCompact v-for="p in store.bestSellers" :key="p.id" v-bind="p" />
      </div>
    </section>

    <!-- 04 · Produtos -->
    <section id="produtos" class="flex scroll-mt-4 flex-col gap-8 pt-16 md:flex-row md:gap-12 md:pt-[140px]">
      <div class="flex w-full flex-col items-start gap-6 md:w-[440px] md:shrink-0">
        <SectionTitle eyebrow="Catálogo" title="Produtos" />
        <p class="m-0 max-w-[400px] font-ui text-base leading-normal text-plum-muted">
          Explore por categoria e encontre o que combina com a sua rotina de cuidados.
        </p>
        <div class="w-full">
          <CategoryItem
            v-for="c in store.categories"
            :key="c"
            :name="c"
            :active="activeCategory === c"
            @click="activeCategory = c"
          />
        </div>
        <div class="hidden pt-4 md:block">
          <RouterLink to="/produtos"><BaseButton icon>Ver todos os produtos</BaseButton></RouterLink>
        </div>
      </div>
      <CategoryFeatureCard
        class="md:min-w-px md:flex-1"
        :title="activeCategory"
        :description="categoryDescription"
        :image="categoriaRosto"
        :to="{ path: '/produtos' }"
      />
      <RouterLink to="/produtos" class="md:hidden"><BaseButton icon class="w-full">Ver todos os produtos</BaseButton></RouterLink>
    </section>
  </div>
</template>
