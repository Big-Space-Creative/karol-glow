import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior: (to) => (to.hash ? { el: to.hash, behavior: 'smooth' } : { top: 0 }),
  routes: [
    // Site
    {
      path: '/',
      component: () => import('../layouts/MainLayout.vue'),
      children: [
        { path: '', name: 'home', component: () => import('../views/HomeView.vue') },
        { path: 'produtos', name: 'produtos', component: () => import('../views/ProductsView.vue') },
        { path: 'produtos/:id', name: 'produto', component: () => import('../views/ProductView.vue') },
        // Vitrine de componentes: só em desenvolvimento
        ...(import.meta.env.DEV ? [{ path: 'componentes', name: 'componentes', component: () => import('../views/ComponentsView.vue') }] : []),
      ],
    },

    // Login
    { path: '/login', name: 'login', component: () => import('../views/LoginView.vue'), meta: { guestOnly: true, noindex: true } },

    // Admin (todas as rotas filhas exigem sessão válida)
    {
      path: '/admin',
      component: () => import('../layouts/AdminLayout.vue'),
      meta: { requiresAuth: true, noindex: true },
      children: [
        { path: '', redirect: { name: 'admin-produtos' } },
        { path: 'produtos', name: 'admin-produtos', component: () => import('../views/admin/ProductListView.vue') },
        { path: 'produtos/novo', name: 'admin-produto-novo', component: () => import('../views/admin/ProductFormView.vue') },
        { path: 'produtos/:id', name: 'admin-produto-editar', component: () => import('../views/admin/ProductFormView.vue') },
        { path: 'catalogo', name: 'admin-catalogo', component: () => import('../views/admin/CatalogView.vue') },
        { path: 'vendas', name: 'admin-vendas', component: () => import('../views/admin/SalesView.vue') },
        { path: 'contato', name: 'admin-contato', component: () => import('../views/admin/SettingsView.vue') },
      ],
    },
  ],
})

// Guarda de navegação: protege o admin e evita voltar ao login já autenticado.
// A sessão é validada pelo servidor (cookie HttpOnly); o front só pergunta quem está logado.
router.beforeEach(async (to) => {
  const auth = useAuthStore()
  const needsAuth = to.matched.some((r) => r.meta.requiresAuth)
  if (!needsAuth && !to.meta.guestOnly) return

  const logged = await auth.fetchMe()
  if (needsAuth && !logged) {
    return { name: 'login', query: { redirect: to.fullPath, ...(auth.expired ? { reason: 'expired' } : {}) } }
  }
  if (to.meta.guestOnly && logged) return { path: '/admin' }
})

// Admin e login não devem ser indexados por buscadores
router.afterEach((to) => {
  if (to.matched.some((r) => r.meta.noindex)) document.title = 'Painel | Karol Glow'
  else if (to.name === 'produtos') document.title = 'Produtos | Karol Glow'
  else if (to.name === 'home') document.title = 'Karol Glow | Cosméticos e beleza'
  let tag = document.head.querySelector('meta[name="robots"]')
  if (to.matched.some((r) => r.meta.noindex)) {
    if (!tag) {
      tag = document.createElement('meta')
      tag.name = 'robots'
      document.head.appendChild(tag)
    }
    tag.content = 'noindex, nofollow'
  } else if (tag) {
    tag.remove()
  }
})

export default router
