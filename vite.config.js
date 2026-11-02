import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  server: {
    // Em desenvolvimento, /api vai para a API local (mesma origem = cookie de sessão sem CORS)
    proxy: {
      '/api': { target: 'http://localhost:3001', changeOrigin: false },
    },
  },
})
