import { createApp } from 'vue'
import { createPinia } from 'pinia'
import '@fontsource-variable/fraunces'
import '@fontsource-variable/plus-jakarta-sans'
import './style.css'
import App from './App.vue'
import router from './router'
import { bindUnauthorized } from './stores/auth'

const app = createApp(App).use(createPinia())
app.use(router)

// Se a API responder 401 durante o uso, volta para o login
bindUnauthorized(router)

app.mount('#app')
