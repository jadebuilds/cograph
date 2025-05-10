import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/main.css'

// Check for token in URL and store it (for OAuth callback)
const urlParams = new URLSearchParams(window.location.search)
const token = urlParams.get('token')

if (token) {
  localStorage.setItem('auth_token', token)

  // Clean up URL
  const url = new URL(window.location.href)
  url.searchParams.delete('token')
  window.history.replaceState({}, document.title, url.toString())
}

// Create the app instance
const app = createApp(App)

// Use Pinia store
app.use(createPinia())

// Use Vue Router
app.use(router)

// Mount the app
app.mount('#app')