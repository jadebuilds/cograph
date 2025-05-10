import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { trpc } from '../utils/trpc'

interface User {
  id: string
  name: string
  avatarUrl?: string
  oauthId: string
}

export const useAuthStore = defineStore('auth', () => {
  // State
  const token = ref<string | null>(localStorage.getItem('auth_token'))
  const user = ref<User | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const isAuthenticated = computed(() => !!token.value)

  // Actions
  function setToken(newToken: string | null) {
    token.value = newToken
    if (newToken) {
      localStorage.setItem('auth_token', newToken)
    } else {
      localStorage.removeItem('auth_token')
    }
  }

  async function login(provider: 'github' | 'google') {
    loading.value = true
    error.value = null

    try {
      // In a production app, we would redirect to OAuth provider here
      // For testing purposes, we're simulating the OAuth flow by calling the tRPC signIn mutation directly

      // In production, this would be handled by the server after OAuth callback
      // Here, we're simulating a successful OAuth login
      const oauthId = `${provider}_${Date.now()}`
      const name = `Test User (${provider})`
      const avatarUrl = `https://via.placeholder.com/150?text=${name.charAt(0)}`

      // Use tRPC to sign in
      const result = await trpc.auth.signIn.mutate({
        oauthProvider: provider,
        oauthId,
        name,
        avatarUrl
      })

      // Set token and user data
      setToken(result.sessionToken)
      user.value = result.user

      return result.user
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to login'
      console.error('Login error:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  // Function to trigger OAuth redirect
  function redirectToOAuth(provider: 'github' | 'google') {
    // Redirect to OAuth provider - use direct server path
    window.location.href = `/auth/${provider}`
  }

  async function fetchUser() {
    if (!token.value) return null

    loading.value = true
    error.value = null

    try {
      // Try to get user session from tRPC
      const session = await trpc.auth.getSession.query()

      if (!session) {
        throw new Error('No active session')
      }

      // Get user data
      const userData = await trpc.auth.getUser.query()
      user.value = userData
      return userData
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch user'
      logout()
      return null
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    if (isAuthenticated.value) {
      try {
        // Call tRPC to sign out
        await trpc.auth.signOut.mutate()
      } catch (err) {
        console.error('Logout error:', err)
      }
    }

    // Clear local state regardless of API success
    user.value = null
    setToken(null)
  }

  // Initialize - try to fetch user on store creation if we have a token
  if (token.value) {
    fetchUser().catch(err => {
      console.error('Error fetching user on initialization:', err)
    })
  }

  return {
    token,
    user,
    loading,
    error,
    isAuthenticated,
    login,
    logout,
    fetchUser,
    setToken,
    redirectToOAuth
  }
})