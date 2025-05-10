<template>
  <div class="min-h-screen flex flex-col items-center bg-white py-8 px-4">
    <!-- Title at the top of the page, smaller than on landing page -->
    <div class="mt-6 mb-12">
      <h1 class="text-center text-3xl font-mono font-bold text-secondary-dark">
        cograph<span class="text-primary">.dev</span>
      </h1>
    </div>

    <!-- Login panel -->
    <div class="max-w-md w-full bg-white p-8 rounded-lg shadow-sm border border-gray-100">
      <h2 class="text-xl font-medium text-gray-800 mb-6 text-center">
        Sign in to continue
      </h2>

      <div v-if="error" class="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded relative mb-6" role="alert">
        <span class="block sm:inline">{{ error }}</span>
      </div>

      <div class="space-y-4">
        <!-- GitHub login button (standard brand button) -->
        <button
          @click="redirectToGitHub"
          class="w-full flex items-center justify-center py-2.5 px-4 border border-gray-300 rounded-md shadow-sm bg-white hover:bg-gray-50 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        >
          <svg class="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 0C4.477 0 0 4.477 0 10c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V19c0 .27.16.59.67.5C17.14 18.16 20 14.42 20 10A10 10 0 0010 0z" clip-rule="evenodd"></path>
          </svg>
          Continue with GitHub
        </button>

        <!-- Google login button (standard brand button) -->
        <button
          @click="redirectToGoogle"
          class="w-full flex items-center justify-center py-2.5 px-4 border border-gray-300 rounded-md shadow-sm bg-white hover:bg-gray-50 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        >
          <svg class="h-5 w-5 mr-2" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
            <path d="M1 1h22v22H1z" fill="none" />
          </svg>
          Continue with Google
        </button>
      </div>

      <!-- For testing purposes, hidden by default -->
      <div v-if="showTestLogin" class="border-t border-gray-200 pt-4 mt-6">
        <p class="text-xs text-gray-500 text-center mb-4">For testing purposes only</p>
        <button
          @click="simulateGitHubLogin"
          class="w-full py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none"
          :disabled="authStore.loading"
        >
          {{ authStore.loading ? 'Simulating Login...' : 'Simulate GitHub Login (test)' }}
        </button>
      </div>

      <div class="mt-4 text-center">
        <button
          @click="toggleTestLogin"
          class="text-xs text-gray-400 hover:text-gray-600"
        >
          {{ showTestLogin ? 'Hide test options' : 'Show test options' }}
        </button>
      </div>
    </div>

    <div class="text-center text-xs text-gray-500 mt-8">
      <p>By logging in, you agree to our Terms of Service and Privacy Policy.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const error = ref<string | null>(null)
const showTestLogin = ref(false)

// Check for error and token parameters on mount
onMounted(() => {
  const errorParam = route.query.error as string | undefined
  if (errorParam) {
    error.value = 'Authentication failed. Please try again.'
  }

  // Check for token query parameter (after OAuth callback)
  const tokenParam = route.query.token as string | undefined
  if (tokenParam) {
    authStore.setToken(tokenParam)

    // Fetch user data
    authStore.fetchUser().then(() => {
      // Redirect to intended page or home
      const redirect = route.query.redirect as string | undefined
      router.replace(redirect || '/')
    }).catch(err => {
      console.error('Error fetching user after OAuth callback:', err)
      error.value = 'Failed to load user data. Please try again.'
    })
  }
})

// OAuth flows
const redirectToGitHub = () => {
  authStore.redirectToOAuth('github')
}

const redirectToGoogle = () => {
  authStore.redirectToOAuth('google')
}

// Simulated login for testing purposes
const simulateGitHubLogin = async () => {
  try {
    // Use tRPC client directly via auth store
    const user = await authStore.login('github')

    if (user) {
      // Success, redirect to home or intended page
      const redirect = route.query.redirect as string | undefined
      router.replace(redirect || '/')
    }
  } catch (err) {
    console.error('Login error:', err)
    error.value = 'Failed to simulate login. See console for details.'
  }
}

const toggleTestLogin = () => {
  showTestLogin.value = !showTestLogin.value
}
</script>