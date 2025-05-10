<template>
  <div class="landing-page">
    <!-- Clean white background -->
    
    <div class="relative z-10 container mx-auto px-4 py-8 min-h-screen flex flex-col">
      <!-- Logo -->
      <div class="logo-container text-center mt-8 mb-16">
        <h1 class="text-4xl md:text-6xl font-mono font-bold text-secondary-dark">
          cograph<span class="text-primary">.dev</span>
        </h1>
        <p class="text-lg md:text-xl text-gray-600 mt-4">
          Collaborative Notebook Proposals
        </p>
      </div>
      
      <!-- Main content -->
      <div class="flex-grow flex flex-col md:flex-row items-center justify-center gap-10 md:gap-20">
        <!-- Left side: App description -->
        <div class="max-w-md">
          <h2 class="text-2xl md:text-3xl font-bold text-secondary-dark mb-6">
            Transform How You Collaborate
          </h2>
          <div class="space-y-4 text-gray-700">
            <p>
              Share Jupyter notebooks, propose changes, and discuss improvements in one integrated platform.
            </p>
            <p>
              Our collaborative workflow makes data science teamwork seamless.
            </p>
            <ul class="mt-6 space-y-2">
              <li class="flex items-center">
                <svg class="h-5 w-5 text-primary mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                </svg>
                <span>Create and manage proposals</span>
              </li>
              <li class="flex items-center">
                <svg class="h-5 w-5 text-primary mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                </svg>
                <span>Comment directly on notebook cells</span>
              </li>
              <li class="flex items-center">
                <svg class="h-5 w-5 text-primary mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                </svg>
                <span>Collaborate with your team effortlessly</span>
              </li>
            </ul>
          </div>
        </div>
        
        <!-- Right side: Login component -->
        <div class="w-full max-w-md">
          <div class="bg-white/90 rounded-lg shadow-xl p-8 backdrop-blur-sm">
            <h2 class="text-2xl font-bold text-secondary-dark mb-8 text-center">
              Get Started
            </h2>
            
            <!-- Auth component for login -->
            <div v-if="!isAuthenticated">
              <p class="text-center text-gray-600 mb-6">
                Sign in with your account to continue
              </p>
              
              <!-- GitHub login button -->
              <button 
                @click="redirectToGitHub" 
                class="w-full bg-gray-800 hover:bg-gray-900 text-white py-3 px-4 rounded-md font-medium flex items-center justify-center"
              >
                <svg class="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 0C4.477 0 0 4.477 0 10c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V19c0 .27.16.59.67.5C17.14 18.16 20 14.42 20 10A10 10 0 0010 0z" clip-rule="evenodd"></path>
                </svg>
                Continue with GitHub
              </button>
              
              <!-- Optional additional login methods -->
              <div class="mt-4">
                <p class="text-center text-gray-500 text-sm">
                  We're using GitHub for authentication
                </p>
              </div>
            </div>
            
            <!-- Welcome back message if already logged in -->
            <div v-else class="text-center">
              <div class="mb-6">
                <div v-if="authStore.user?.avatarUrl" class="h-20 w-20 rounded-full overflow-hidden mx-auto mb-4">
                  <img :src="authStore.user.avatarUrl" alt="User avatar" class="h-full w-full object-cover" />
                </div>
                <div v-else class="h-20 w-20 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {{ userInitial }}
                </div>
                <p class="text-xl font-medium">Welcome back, {{ authStore.user?.name }}</p>
              </div>
              
              <div class="space-y-4">
                <RouterLink 
                  to="/notebooks/latest" 
                  class="block w-full bg-primary hover:bg-primary-dark text-white py-2 px-4 rounded-md font-medium transition duration-150"
                >
                  Go to Files
                </RouterLink>
                
                <RouterLink 
                  to="/proposals" 
                  class="block w-full bg-secondary hover:bg-secondary-dark text-white py-2 px-4 rounded-md font-medium transition duration-150"
                >
                  View Proposals
                </RouterLink>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Footer -->
      <div class="mt-16 pt-8 border-t border-gray-200 text-center text-gray-500 text-sm">
        <p>&copy; {{ currentYear }} cograph.dev | A collaborative notebook platform</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const isAuthenticated = computed(() => authStore.isAuthenticated)

const userInitial = computed(() => {
  if (!authStore.user?.name) return 'U'
  return authStore.user.name.charAt(0).toUpperCase()
})

const currentYear = computed(() => new Date().getFullYear())

const redirectToGitHub = () => {
  authStore.redirectToOAuth('github')
}
</script>

<style scoped>
.landing-page {
  position: relative;
  min-height: 100vh;
  background-color: #ffffff;
}
</style>