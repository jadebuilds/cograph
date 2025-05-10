<template>
  <div class="proposals-view">
    <header class="page-header">
      <h1>Proposals</h1>
      <div class="filters">
        <select v-model="statusFilter" class="filter-dropdown">
          <option value="">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="ACTIVE">Active</option>
          <option value="PASSED">Passed</option>
          <option value="REJECTED">Rejected</option>
          <option value="EXPIRED">Expired</option>
        </select>
      </div>
    </header>

    <div v-if="loading" class="loading">Loading proposals...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else class="proposals-container">
      <div v-if="proposals.length === 0" class="no-proposals">
        <p>No proposals found matching your criteria.</p>
      </div>
      <div v-else class="proposals-grid">
        <div v-for="proposal in proposals" :key="proposal.id" class="proposal-card card">
          <div class="proposal-header">
            <h2 class="proposal-title">
              <RouterLink :to="`/proposals/${proposal.id}`">
                {{ proposal.title }}
              </RouterLink>
            </h2>
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
            <div class="proposal-author">
              <span v-if="proposal.author.avatarUrl" class="author-avatar">
                <img :src="proposal.author.avatarUrl" alt="Author avatar" />
              </span>
              <span>{{ proposal.author.name }}</span>
            </div>
            
            <div class="proposal-stats">
              <span class="comments-count">
                {{ proposal._count.comments }} comments
              </span>
              <span class="proposal-date">
                {{ formatDate(proposal.createdAt) }}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div v-if="hasMore" class="load-more">
        <button @click="loadMore" class="btn" :disabled="loadingMore">
          {{ loadingMore ? 'Loading...' : 'Load More' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { RouterLink } from 'vue-router'

interface Author {
  id: string
  name: string
  avatarUrl?: string
}

interface Notebook {
  id: string
  filePath: string
}

interface ProposalCount {
  comments: number
}

interface Proposal {
  id: string
  title: string
  status: string
  notebook: Notebook
  author: Author
  createdAt: string
  _count: ProposalCount
}

const statusFilter = ref('')
const proposals = ref<Proposal[]>([])
const loading = ref(true)
const loadingMore = ref(false)
const error = ref<string | null>(null)
const cursor = ref<string | null>(null)
const hasMore = ref(false)

watch(statusFilter, () => {
  // Reset and reload when filter changes
  proposals.value = []
  cursor.value = null
  fetchProposals()
})

onMounted(() => {
  fetchProposals()
})

const fetchProposals = async () => {
  loading.value = true
  error.value = null
  
  try {
    // In a real app, you would use your tRPC client here
    // For now, we'll simulate fetching proposals data
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Mock data
    const mockProposals: Proposal[] = [
      {
        id: '1',
        title: 'Add visualization for data analysis',
        status: statusFilter.value || 'ACTIVE',
        notebook: {
          id: 'notebook1',
          filePath: '/notebooks/data-analysis.ipynb'
        },
        author: {
          id: 'user1',
          name: 'User One',
          avatarUrl: '',
        },
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        _count: {
          comments: 5
        }
      },
      {
        id: '2',
        title: 'Fix data preprocessing issues',
        status: statusFilter.value || 'DRAFT',
        notebook: {
          id: 'notebook2',
          filePath: '/notebooks/preprocessing.ipynb'
        },
        author: {
          id: 'user2',
          name: 'User Two',
          avatarUrl: '',
        },
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        _count: {
          comments: 2
        }
      },
      {
        id: '3',
        title: 'Improve model training performance',
        status: statusFilter.value || 'PASSED',
        notebook: {
          id: 'notebook3',
          filePath: '/notebooks/model-training.ipynb'
        },
        author: {
          id: 'user3',
          name: 'User Three',
          avatarUrl: '',
        },
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        _count: {
          comments: 12
        }
      }
    ]
    
    proposals.value = mockProposals
    cursor.value = 'mock-cursor'
    hasMore.value = false // Set to true in real implementation if there are more
  } catch (err) {
    error.value = 'Failed to load proposals'
    console.error(err)
  } finally {
    loading.value = false
  }
}

const loadMore = async () => {
  if (!cursor.value || loadingMore.value) return
  
  loadingMore.value = true
  
  try {
    // In a real app, you would fetch more proposals using the cursor
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Mock more data
    const moreProposals: Proposal[] = [
      {
        id: '4',
        title: 'Add new dataset integration',
        status: statusFilter.value || 'ACTIVE',
        notebook: {
          id: 'notebook4',
          filePath: '/notebooks/dataset-integration.ipynb'
        },
        author: {
          id: 'user4',
          name: 'User Four',
          avatarUrl: '',
        },
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        _count: {
          comments: 8
        }
      }
    ]
    
    proposals.value = [...proposals.value, ...moreProposals]
    cursor.value = null // No more data after this
    hasMore.value = false
  } catch (err) {
    error.value = 'Failed to load more proposals'
    console.error(err)
  } finally {
    loadingMore.value = false
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
.proposals-view {
  padding: 1rem 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.filter-dropdown {
  padding: 0.5rem;
  border-radius: 4px;
  border: 1px solid var(--color-gray);
}

.loading, .error, .no-proposals {
  text-align: center;
  padding: 2rem;
}

.error {
  color: var(--color-danger);
}

.proposals-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.proposal-card {
  padding: 1.5rem;
  transition: transform 0.2s, box-shadow 0.2s;
}

.proposal-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.proposal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.proposal-title {
  font-size: 1.25rem;
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

.proposal-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1.5rem;
  font-size: 0.9rem;
  color: var(--color-gray);
}

.proposal-author {
  display: flex;
  align-items: center;
}

.author-avatar {
  margin-right: 0.5rem;
}

.author-avatar img {
  width: 24px;
  height: 24px;
  border-radius: 50%;
}

.proposal-stats {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.3rem;
}

.comments-count {
  font-size: 0.85rem;
}

.proposal-date {
  font-size: 0.8rem;
}

.load-more {
  text-align: center;
  margin-top: 2rem;
}
</style>