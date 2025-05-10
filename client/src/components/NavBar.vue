<template>
  <nav class="bg-secondary-dark shadow-md">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <!-- Logo -->
        <div class="flex-shrink-0 flex items-center">
          <RouterLink to="/" class="font-mono text-xl font-bold text-white hover:text-primary transition duration-150">
            cograph.dev
          </RouterLink>
        </div>
        
        <div class="flex items-center space-x-4">
          <!-- Desktop Navigation Links -->
          <div class="hidden md:ml-6 md:flex md:space-x-8">
            <RouterLink
              to="/notebooks/latest"
              class="text-gray-200 hover:text-primary px-3 py-2 rounded-md text-sm font-medium border-b-2 border-transparent transition duration-150"
              :class="{ 'border-primary text-primary': isActive('notebooks') }"
            >
              Files
            </RouterLink>
            
            <RouterLink
              to="/proposals"
              class="text-gray-200 hover:text-primary px-3 py-2 rounded-md text-sm font-medium border-b-2 border-transparent transition duration-150"
              :class="{ 'border-primary text-primary': isActive('proposals') }"
            >
              Proposals
            </RouterLink>
          </div>
          
          <!-- User Menu (Desktop) -->
          <div class="ml-3 relative">
            <!-- Authenticated User -->
            <div v-if="isAuthenticated" class="flex items-center space-x-3">
              <div class="relative" ref="userMenuContainer">
                <button
                  @click="toggleUserMenu"
                  class="flex items-center text-gray-200 hover:text-primary transition duration-150 rounded-md"
                  :class="{ 'text-primary': userMenuOpen }"
                >
                  <div class="mr-2 flex items-center">
                    <!-- User Avatar -->
                    <div v-if="userAvatar" class="h-8 w-8 rounded-full overflow-hidden">
                      <img :src="userAvatar" alt="User avatar" class="h-full w-full object-cover" />
                    </div>
                    <div v-else class="flex h-8 w-8 rounded-full bg-primary text-white items-center justify-center">
                      {{ userInitial }}
                    </div>
                  </div>
                  
                  <span class="hidden sm:block text-sm font-medium">{{ userName }}</span>
                  
                  <!-- Dropdown Icon -->
                  <svg 
                    class="ml-1 h-5 w-5" 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                    :class="{ 'transform rotate-180': userMenuOpen }"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                <!-- User Dropdown Menu -->
                <div
                  v-if="userMenuOpen"
                  class="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
                  role="menu"
                  aria-orientation="vertical"
                  aria-labelledby="user-menu"
                >
                  <RouterLink
                    to="/account"
                    class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    @click="userMenuOpen = false"
                  >
                    Your Profile
                  </RouterLink>
                  
                  <button
                    @click="logout"
                    class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            </div>
            
            <!-- Login Button (when not authenticated) -->
            <RouterLink
              v-else
              to="/login"
              class="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-md text-sm font-medium transition duration-150"
            >
              Login
            </RouterLink>
          </div>
          
          <!-- Mobile menu button -->
          <button
            @click="toggleMobileMenu"
            type="button"
            class="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-200 hover:text-white hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
            aria-expanded="false"
          >
            <span class="sr-only">Open main menu</span>
            <!-- Heroicon name: menu/close -->
            <svg
              class="h-6 w-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                v-if="!mobileMenuOpen"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
              <path
                v-else
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
    
    <!-- Mobile menu -->
    <div
      v-show="mobileMenuOpen"
      class="md:hidden bg-secondary-dark transition-all duration-300 ease-in-out"
    >
      <div class="px-2 pt-2 pb-3 space-y-1 sm:px-3">
        <RouterLink
          to="/notebooks/latest"
          class="text-gray-200 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
          :class="{ 'bg-secondary text-white': isActive('notebooks') }"
          @click="mobileMenuOpen = false"
        >
          Files
        </RouterLink>
        
        <RouterLink
          to="/proposals"
          class="text-gray-200 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
          :class="{ 'bg-secondary text-white': isActive('proposals') }"
          @click="mobileMenuOpen = false"
        >
          Proposals
        </RouterLink>
        
        <div v-if="isAuthenticated">
          <RouterLink
            to="/account"
            class="text-gray-200 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
            :class="{ 'bg-secondary text-white': isActive('account') }"
            @click="mobileMenuOpen = false"
          >
            Account
          </RouterLink>
          
          <button
            @click="handleMobileLogout"
            class="text-red-300 hover:text-red-200 w-full text-left block px-3 py-2 rounded-md text-base font-medium"
          >
            Sign out
          </button>
        </div>
        
        <RouterLink
          v-else
          to="/login"
          class="bg-primary hover:bg-primary-dark text-white block px-3 py-2 rounded-md text-base font-medium"
          @click="mobileMenuOpen = false"
        >
          Login
        </RouterLink>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { RouterLink, useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { trpc } from '../utils/trpc'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// Refs
const mobileMenuOpen = ref(false)
const userMenuOpen = ref(false)
const userMenuContainer = ref<HTMLElement | null>(null)

// Computed
const isAuthenticated = computed(() => authStore.isAuthenticated)

const userInitial = computed(() => {
  if (!authStore.user?.name) return 'U'
  return authStore.user.name.charAt(0).toUpperCase()
})

const userName = computed(() => {
  return authStore.user?.name || 'User'
})

const userAvatar = computed(() => {
  return authStore.user?.avatarUrl
})

// Methods
const isActive = (routeName: string) => {
  return route.path.includes(`/${routeName}`)
}

const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value
  // Close user menu if open
  if (mobileMenuOpen.value) {
    userMenuOpen.value = false
  }
}

const toggleUserMenu = () => {
  userMenuOpen.value = !userMenuOpen.value
}

const logout = async () => {
  userMenuOpen.value = false
  try {
    // Call tRPC to sign out
    await trpc.auth.signOut.mutate()
  } catch (err) {
    console.error('Logout error:', err)
  }
  
  // Clear local state
  authStore.logout()
  router.push('/login')
}

const handleMobileLogout = async () => {
  mobileMenuOpen.value = false
  await logout()
}

// Close menu when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  if (userMenuContainer.value && !userMenuContainer.value.contains(event.target as Node)) {
    userMenuOpen.value = false
  }
}

// Lifecycle hooks
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>