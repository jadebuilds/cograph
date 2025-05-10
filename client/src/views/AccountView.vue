<template>
  <div class="account-view">
    <div v-if="loading" class="loading">Loading your account...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="!isAuthenticated" class="not-authenticated">
      <h2>Please log in to view your account</h2>
      <RouterLink to="/login" class="btn">Log in</RouterLink>
    </div>
    <div v-else class="account-container">
      <div class="account-header card">
        <div class="account-info">
          <div class="avatar-container">
            <img 
              v-if="user?.avatarUrl" 
              :src="user.avatarUrl" 
              alt="Profile avatar" 
              class="avatar"
            />
            <div v-else class="avatar avatar-placeholder">
              {{ user?.name?.charAt(0).toUpperCase() || '?' }}
            </div>
          </div>
          
          <div class="user-details">
            <h1 class="user-name">{{ user?.name }}</h1>
            <div class="user-stats">
              <div class="stat">
                <span class="stat-value">{{ userStats.proposals }}</span>
                <span class="stat-label">Proposals</span>
              </div>
              <div class="stat">
                <span class="stat-value">{{ userStats.comments }}</span>
                <span class="stat-label">Comments</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="account-actions">
          <button @click="showEditForm = !showEditForm" class="btn">
            {{ showEditForm ? 'Cancel' : 'Edit Profile' }}
          </button>
        </div>
      </div>
      
      <div v-if="showEditForm" class="edit-profile-form card">
        <h2>Edit Profile</h2>
        <div class="form-group">
          <label for="name">Name</label>
          <input type="text" id="name" v-model="editForm.name" placeholder="Your name" />
        </div>
        <div class="form-group">
          <label for="avatarUrl">Avatar URL</label>
          <input type="url" id="avatarUrl" v-model="editForm.avatarUrl" placeholder="URL to your profile picture" />
        </div>
        <div class="form-actions">
          <button @click="saveProfile" class="btn" :disabled="saving">
            {{ saving ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </div>
      
      <div class="account-content">
        <div class="content-tabs">
          <button 
            @click="activeTab = 'proposals'" 
            class="tab-button" 
            :class="{ active: activeTab === 'proposals' }"
          >
            My Proposals
          </button>
          <button 
            @click="activeTab = 'comments'" 
            class="tab-button" 
            :class="{ active: activeTab === 'comments' }"
          >
            My Comments
          </button>
        </div>
        
        <div class="tab-content">
          <div v-if="activeTab === 'proposals'" class="proposals-content">
            <div v-if="userProposals.length === 0" class="no-content">
              You haven't created any proposals yet.
            </div>
            <div v-else class="proposals-list">
              <div v-for="proposal in userProposals" :key="proposal.id" class="proposal-item card">
                <div class="proposal-header">
                  <h3 class="proposal-title">
                    <RouterLink :to="`/proposals/${proposal.id}`">
                      {{ proposal.title }}
                    </RouterLink>
                  </h3>
                  <span class="proposal-status" :class="proposal.status.toLowerCase()">
                    {{ proposal.status }}
                  </span>
                </div>
                <div class="proposal-notebook">
                  Notebook: <RouterLink :to="`/notebooks/${proposal.notebook.id}`">
                    {{ getNotebookName(proposal.notebook.filePath) }}
                  </RouterLink>
                </div>
                <div class="proposal-meta">
                  <span class="proposal-comments">{{ proposal._count.comments }} comments</span>
                  <span class="proposal-date">{{ formatDate(proposal.createdAt) }}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div v-if="activeTab === 'comments'" class="comments-content">
            <div v-if="userComments.length === 0" class="no-content">
              You haven't posted any comments yet.
            </div>
            <div v-else class="comments-list">
              <div v-for="comment in userComments" :key="comment.id" class="comment-item card">
                <div class="comment-proposal">
                  On proposal: <RouterLink :to="`/proposals/${comment.proposal.id}`">
                    {{ comment.proposal.title }}
                  </RouterLink>
                </div>
                <div class="comment-content">
                  {{ comment.content }}
                </div>
                <div class="comment-meta">
                  <span v-if="comment._count.replies > 0" class="comment-replies">
                    <RouterLink :to="`/discussions/${comment.id}`">
                      {{ comment._count.replies }} replies
                    </RouterLink>
                  </span>
                  <span class="comment-date">{{ formatDate(comment.createdAt) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()

interface User {
  id: string
  name: string
  avatarUrl?: string
}

interface Notebook {
  id: string
  filePath: string
}

interface Proposal {
  id: string
  title: string
  status: string
  notebook: Notebook
  createdAt: string
  _count: {
    comments: number
  }
}

interface ProposalBrief {
  id: string
  title: string
}

interface Comment {
  id: string
  proposal: ProposalBrief
  content: string
  createdAt: string
  _count: {
    replies: number
  }
}

const loading = ref(true)
const error = ref<string | null>(null)
const saving = ref(false)
const showEditForm = ref(false)
const activeTab = ref('proposals')

const userStats = ref({
  proposals: 0,
  comments: 0
})

const userProposals = ref<Proposal[]>([])
const userComments = ref<Comment[]>([])

const editForm = ref({
  name: '',
  avatarUrl: ''
})

const isAuthenticated = computed(() => authStore.isAuthenticated)
const user = computed(() => authStore.user)

onMounted(async () => {
  if (isAuthenticated.value) {
    await Promise.all([
      fetchUserStats(),
      fetchUserProposals(),
      fetchUserComments()
    ])
    
    // Initialize edit form with current values
    editForm.value.name = user.value?.name || ''
    editForm.value.avatarUrl = user.value?.avatarUrl || ''
  } else {
    loading.value = false
  }
})

const fetchUserStats = async () => {
  loading.value = true
  error.value = null
  
  try {
    // In a real app, you would use your tRPC client here
    // For now, we'll simulate fetching user stats
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // Mock data
    userStats.value = {
      proposals: 3,
      comments: 8
    }
  } catch (err) {
    error.value = 'Failed to load user statistics'
    console.error(err)
  } finally {
    loading.value = false
  }
}

const fetchUserProposals = async () => {
  try {
    // In a real app, you would use your tRPC client here
    // For now, we'll simulate fetching user proposals
    await new Promise(resolve => setTimeout(resolve, 400))
    
    // Mock data
    userProposals.value = [
      {
        id: '1',
        title: 'Add visualization for data analysis',
        status: 'ACTIVE',
        notebook: {
          id: 'notebook1',
          filePath: '/notebooks/data-analysis.ipynb'
        },
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        _count: {
          comments: 5
        }
      },
      {
        id: '3',
        title: 'Improve model training performance',
        status: 'DRAFT',
        notebook: {
          id: 'notebook3',
          filePath: '/notebooks/model-training.ipynb'
        },
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        _count: {
          comments: 0
        }
      },
      {
        id: '5',
        title: 'Add new data visualization techniques',
        status: 'PASSED',
        notebook: {
          id: 'notebook2',
          filePath: '/notebooks/visualization.ipynb'
        },
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        _count: {
          comments: 12
        }
      }
    ]
  } catch (err) {
    console.error('Failed to load user proposals:', err)
  }
}

const fetchUserComments = async () => {
  try {
    // In a real app, you would use your tRPC client here
    // For now, we'll simulate fetching user comments
    await new Promise(resolve => setTimeout(resolve, 400))
    
    // Mock data
    userComments.value = [
      {
        id: 'comment1',
        proposal: {
          id: '2',
          title: 'Fix data preprocessing issues'
        },
        content: 'I think we should consider using a different normalization technique here.',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        _count: {
          replies: 3
        }
      },
      {
        id: 'comment2',
        proposal: {
          id: '4',
          title: 'Add new dataset integration'
        },
        content: 'This looks great! Have you considered adding support for CSV imports as well?',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        _count: {
          replies: 1
        }
      }
    ]
  } catch (err) {
    console.error('Failed to load user comments:', err)
  }
}

const saveProfile = async () => {
  if (!isAuthenticated.value) return
  
  saving.value = true
  
  try {
    // In a real app, you would use your tRPC client here
    // For now, we'll simulate updating the profile
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Update local user data
    if (authStore.user) {
      authStore.user = {
        ...authStore.user,
        name: editForm.value.name,
        avatarUrl: editForm.value.avatarUrl
      }
    }
    
    // Hide form after successful save
    showEditForm.value = false
  } catch (err) {
    error.value = 'Failed to update profile'
    console.error(err)
  } finally {
    saving.value = false
  }
}

const getNotebookName = (filePath: string) => {
  const parts = filePath.split('/')
  const filename = parts[parts.length - 1]
  return filename.replace(/\.[^/.]+$/, '')
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date)
}
</script>

<style scoped>
.account-view {
  padding: 1rem 0;
}

.loading, .error, .not-authenticated {
  text-align: center;
  padding: 2rem;
}

.error {
  color: var(--color-danger);
}

.not-authenticated {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.account-header {
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.account-info {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.avatar-container {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  overflow: hidden;
}

.avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  background-color: var(--color-primary);
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 2.5rem;
  font-weight: bold;
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.user-name {
  font-size: 1.75rem;
  margin: 0;
}

.user-stats {
  display: flex;
  gap: 1.5rem;
}

.stat {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-weight: bold;
  font-size: 1.25rem;
}

.stat-label {
  font-size: 0.9rem;
  color: var(--color-gray);
}

.edit-profile-form {
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.edit-profile-form h2 {
  margin-bottom: 1.5rem;
  color: var(--color-secondary);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 1rem;
}

.content-tabs {
  display: flex;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid var(--color-gray);
}

.tab-button {
  padding: 0.75rem 1.5rem;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  cursor: pointer;
  font-size: 1rem;
  font-weight: bold;
  color: var(--color-gray);
  transition: all 0.3s;
}

.tab-button:hover {
  color: var(--color-primary);
}

.tab-button.active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
}

.no-content {
  text-align: center;
  padding: 2rem;
  color: var(--color-gray);
  font-style: italic;
}

.proposals-list, .comments-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.proposal-item, .comment-item {
  padding: 1.25rem;
  transition: transform 0.2s;
}

.proposal-item:hover, .comment-item:hover {
  transform: translateY(-3px);
}

.proposal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.proposal-title {
  font-size: 1.1rem;
  margin: 0;
  padding-right: 1rem;
}

.proposal-title a {
  color: var(--color-text);
  text-decoration: none;
}

.proposal-title a:hover {
  color: var(--color-primary);
}

.proposal-status {
  font-size: 0.8rem;
  font-weight: bold;
  padding: 0.3rem 0.6rem;
  border-radius: 20px;
  text-transform: lowercase;
  white-space: nowrap;
}

.proposal-status.draft {
  background-color: #e2e8f0;
  color: #4a5568;
}

.proposal-status.active {
  background-color: #ebf8ff;
  color: #2b6cb0;
}

.proposal-status.passed {
  background-color: #f0fff4;
  color: #276749;
}

.proposal-status.rejected {
  background-color: #fff5f5;
  color: #c53030;
}

.proposal-status.expired {
  background-color: #f7fafc;
  color: #718096;
}

.proposal-notebook {
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.proposal-meta, .comment-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: var(--color-gray);
}

.comment-proposal {
  margin-bottom: 0.75rem;
  font-size: 0.9rem;
}

.comment-content {
  margin-bottom: 1rem;
  font-size: 0.95rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.comment-replies a {
  text-decoration: none;
  color: var(--color-primary);
}

.comment-replies a:hover {
  text-decoration: underline;
}
</style>