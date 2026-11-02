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
        { path: 'componentes', name: 'componentes', component: () => import('../views/ComponentsView.vue') },
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
      ],
    },
  ],
})

// Guarda de navegação: protege o admin e evita voltar ao login já autenticado
router.beforeEach((to) => {
  const auth = useAuthStore()
  const needsAuth = to.matched.some((r) => r.meta.requiresAuth)

  if (needsAuth && !auth.check()) {
    return { name: 'login', query: { redirect: to.fullPath, ...(auth.expired ? { reason: 'expired' } : {}) } }
  }
  if (to.meta.guestOnly && auth.check()) return { path: '/admin' }
  if (needsAuth) auth.touch()
})

// Admin e login não devem ser indexados por buscadores
router.afterEach((to) => {
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
