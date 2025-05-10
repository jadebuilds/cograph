import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import DefaultLayout from '../layouts/DefaultLayout.vue'

// Define routes with lazy loading
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: DefaultLayout,
      children: [
        {
          path: '',
          name: 'home',
          component: () => import('../views/HomeView.vue')
        },
        {
          path: 'notebooks/:id',
          name: 'notebook',
          component: () => import('../views/NotebookView.vue'),
          props: true
        },
        {
          path: 'proposals',
          name: 'proposals',
          component: () => import('../views/ProposalsView.vue')
        },
        {
          path: 'proposals/:id',
          name: 'proposal-detail',
          component: () => import('../views/ProposalDetailView.vue'),
          props: true
        },
        {
          path: 'proposals/create',
          name: 'proposal-create',
          component: () => import('../views/ProposalDetailView.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'proposals/:id/edit',
          name: 'proposal-edit',
          component: () => import('../views/ProposalDetailView.vue'),
          props: true,
          meta: { requiresAuth: true }
        },
        {
          path: 'discussions/:id',
          name: 'discussion',
          component: () => import('../views/DiscussionView.vue'),
          props: true
        },
        {
          path: 'account',
          name: 'account',
          component: () => import('../views/AccountView.vue'),
          meta: { requiresAuth: true }
        }
      ]
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { hideNavbar: true }
    },
    // Redirect for GitHub OAuth - redirects to the server's OAuth endpoint
    {
      path: '/auth/github',
      beforeEnter: () => {
        // Direct to the OAuth start path configured in the server
        // This matches the startRedirectPath in the server's oauth2 configuration
        window.location.href = '/auth/github';
        return false;
      }
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../views/NotFoundView.vue')
    }
  ]
})

// Navigation guards for authentication
router.beforeEach(async (to, from, next) => {
  // Get auth store
  const authStore = useAuthStore()
  const isAuthenticated = authStore.isAuthenticated

  // Check if route requires authentication
  if (to.meta.requiresAuth && !isAuthenticated) {
    next({
      name: 'login',
      query: {
        redirect: to.fullPath,
        error: 'auth_required'
      }
    })
  }
  // If going to login page and already authenticated, redirect to home
  else if (to.name === 'login' && isAuthenticated) {
    next({ name: 'home' })
  }
  else {
    next()
  }
})

// After navigation, check for error parameters
router.afterEach((to) => {
  // Process any error message in the URL
  if (to.query.error === 'auth_required') {
    // Could show a toast/notification here
    console.log('Authentication required to access this page')
  }
})

export default router