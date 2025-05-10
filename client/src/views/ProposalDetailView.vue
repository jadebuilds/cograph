<template>
  <div class="proposal-view">
    <div v-if="loading" class="loading">Loading proposal...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="proposal" class="proposal-container">
      <div class="proposal-actions">
        <RouterLink :to="`/notebooks/${proposal.notebook.id}`" class="btn-back">
          &larr; Back to Notebook
        </RouterLink>
        
        <div v-if="isAuthor" class="author-actions">
          <button 
            v-if="proposal.status === 'DRAFT'" 
            @click="activateProposal" 
            class="btn btn-activate"
          >
            Activate Proposal
          </button>
          <button 
            v-if="proposal.status === 'DRAFT'"
            @click="editProposal"
            class="btn"
          >
            Edit
          </button>
          <button 
            v-if="proposal.status === 'DRAFT'"
            @click="confirmDelete"
            class="btn btn-danger"
          >
            Delete
          </button>
        </div>
      </div>
      
      <div class="proposal-header card">
        <div class="proposal-meta">
          <span class="proposal-status" :class="proposal.status.toLowerCase()">
            {{ proposal.status }}
          </span>
          <span class="proposal-date">
            Created {{ formatDate(proposal.createdAt) }}
          </span>
        </div>
        
        <h1 class="proposal-title">{{ proposal.title }}</h1>
        
        <div class="proposal-author">
          <span v-if="proposal.author.avatarUrl" class="author-avatar">
            <img :src="proposal.author.avatarUrl" alt="Author avatar" />
          </span>
          <span class="author-name">{{ proposal.author.name }}</span>
        </div>
      </div>
      
      <div class="proposal-details card">
        <div class="proposal-rules">
          <div class="rule">
            <span class="rule-label">Threshold:</span>
            <span class="rule-value">{{ proposal.thresholdPct }}%</span>
          </div>
          <div class="rule">
            <span class="rule-label">Quorum:</span>
            <span class="rule-value">{{ proposal.quorum }} votes</span>
          </div>
        </div>
        
        <div class="notebook-info">
          <span class="notebook-label">Notebook:</span>
          <RouterLink :to="`/notebooks/${proposal.notebook.id}`" class="notebook-link">
            {{ getNotebookName(proposal.notebook.filePath) }}
          </RouterLink>
        </div>
      </div>
      
      <div class="proposal-comments card">
        <h2 class="comments-title">Discussion ({{ proposal.comments.length }})</h2>
        
        <div v-if="isAuthenticated" class="comment-form">
          <h3>Add your comment</h3>
          <textarea 
            v-model="newComment" 
            placeholder="Share your thoughts on this proposal..."
            rows="4"
            class="comment-input"
          ></textarea>
          <button @click="submitComment" class="btn" :disabled="!newComment.trim()">
            Post Comment
          </button>
        </div>
        
        <div v-else class="login-prompt">
          <RouterLink to="/login" class="btn">Login to Comment</RouterLink>
        </div>
        
        <div v-if="proposal.comments.length === 0" class="no-comments">
          No comments yet. Be the first to comment!
        </div>
        
        <div v-else class="comments-list">
          <div v-for="comment in proposal.comments" :key="comment.id" class="comment">
            <div class="comment-header">
              <div class="comment-author">
                <span v-if="comment.author.avatarUrl" class="comment-avatar">
                  <img :src="comment.author.avatarUrl" alt="Author avatar" />
                </span>
                <span class="comment-author-name">{{ comment.author.name }}</span>
              </div>
              <span class="comment-date">{{ formatDate(comment.createdAt) }}</span>
            </div>
            
            <div class="comment-content">{{ comment.content }}</div>
            
            <div class="comment-actions">
              <button @click="replyToComment(comment.id)" class="btn-link">
                Reply ({{ comment._count.replies }})
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

// Props
const props = defineProps<{
  id: string
}>()

const router = useRouter()
const authStore = useAuthStore()

interface Author {
  id: string
  name: string
  avatarUrl?: string
}

interface Notebook {
  id: string
  filePath: string
}

interface CommentCount {
  replies: number
}

interface Comment {
  id: string
  author: Author
  content: string
  createdAt: string
  _count: CommentCount
}

interface Proposal {
  id: string
  title: string
  status: string
  thresholdPct: number
  quorum: number
  author: Author
  notebook: Notebook
  createdAt: string
  comments: Comment[]
}

const proposal = ref<Proposal | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const newComment = ref('')

const isAuthenticated = computed(() => authStore.isAuthenticated)
const isAuthor = computed(() => {
  if (!proposal.value || !authStore.user) return false
  return proposal.value.author.id === authStore.user.id
})

onMounted(async () => {
  await fetchProposal()
})

const fetchProposal = async () => {
  loading.value = true
  error.value = null
  
  try {
    // In a real app, you would use your tRPC client here
    // For now, we'll simulate fetching proposal data
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Mock data
    proposal.value = {
      id: props.id,
      title: 'Add visualization for data analysis',
      status: 'ACTIVE',
      thresholdPct: 51,
      quorum: 5,
      author: {
        id: 'user1',
        name: 'User One',
        avatarUrl: '',
      },
      notebook: {
        id: 'notebook1',
        filePath: '/notebooks/data-analysis.ipynb',
      },
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      comments: [
        {
          id: 'comment1',
          author: {
            id: 'user2',
            name: 'User Two',
            avatarUrl: '',
          },
          content: 'This is a great proposal! I fully support adding these visualizations.',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          _count: {
            replies: 2
          }
        },
        {
          id: 'comment2',
          author: {
            id: 'user3',
            name: 'User Three',
            avatarUrl: '',
          },
          content: 'Have you considered using a different visualization library?',
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          _count: {
            replies: 0
          }
        }
      ]
    }
  } catch (err) {
    error.value = 'Failed to load proposal data'
    console.error(err)
  } finally {
    loading.value = false
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

const submitComment = async () => {
  if (!newComment.value.trim() || !isAuthenticated.value) return
  
  try {
    // In a real app, you would use your tRPC client here
    // For now, we'll simulate adding a comment
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // Add comment to the list
    if (proposal.value) {
      proposal.value.comments.unshift({
        id: `comment-${Date.now()}`,
        author: {
          id: authStore.user?.id || 'current-user',
          name: authStore.user?.name || 'Current User',
          avatarUrl: authStore.user?.avatarUrl,
        },
        content: newComment.value,
        createdAt: new Date().toISOString(),
        _count: {
          replies: 0
        }
      })
      
      // Clear input
      newComment.value = ''
    }
  } catch (err) {
    console.error('Failed to post comment:', err)
    // Show error message to user in a real app
  }
}

const replyToComment = (commentId: string) => {
  router.push({
    name: 'discussion',
    params: { id: commentId }
  })
}

const editProposal = () => {
  router.push({
    name: 'proposal-edit',
    params: { id: props.id }
  })
}

const activateProposal = async () => {
  if (!proposal.value) return
  
  try {
    // In a real app, you would use your tRPC client here
    // For now, we'll simulate activating the proposal
    await new Promise(resolve => setTimeout(resolve, 300))
    
    proposal.value.status = 'ACTIVE'
    // Show success message to user in a real app
  } catch (err) {
    console.error('Failed to activate proposal:', err)
    // Show error message to user in a real app
  }
}

const confirmDelete = () => {
  // In a real app, you would show a confirmation dialog
  const confirmed = window.confirm('Are you sure you want to delete this proposal?')
  
  if (confirmed) {
    deleteProposal()
  }
}

const deleteProposal = async () => {
  try {
    // In a real app, you would use your tRPC client here
    // For now, we'll simulate deleting the proposal
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // Navigate back to notebook page
    router.push({
      name: 'notebook',
      params: { id: proposal.value?.notebook.id || 'notebook1' }
    })
  } catch (err) {
    console.error('Failed to delete proposal:', err)
    // Show error message to user in a real app
  }
}
</script>

<style scoped>
.proposal-view {
  padding: 1rem 0;
}

.loading, .error {
  text-align: center;
  padding: 2rem;
}

.error {
  color: var(--color-danger);
}

.proposal-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.btn-back {
  color: var(--color-text);
  text-decoration: none;
  display: inline-flex;
  align-items: center;
}

.btn-back:hover {
  color: var(--color-primary);
}

.author-actions {
  display: flex;
  gap: 0.75rem;
}

.btn-activate {
  background-color: var(--color-success);
}

.btn-danger {
  background-color: var(--color-danger);
}

.proposal-header {
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.proposal-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.proposal-status {
  font-size: 0.8rem;
  font-weight: bold;
  padding: 0.3rem 0.6rem;
  border-radius: 20px;
  text-transform: lowercase;
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

.proposal-date {
  font-size: 0.9rem;
  color: var(--color-gray);
}

.proposal-title {
  font-size: 1.75rem;
  margin-bottom: 1.5rem;
  color: var(--color-secondary);
}

.proposal-author {
  display: flex;
  align-items: center;
}

.author-avatar {
  margin-right: 0.75rem;
}

.author-avatar img {
  width: 32px;
  height: 32px;
  border-radius: 50%;
}

.author-name {
  font-weight: bold;
}

.proposal-details {
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.proposal-rules {
  display: flex;
  gap: 2rem;
  margin-bottom: 1.5rem;
}

.rule-label, .notebook-label {
  font-weight: bold;
  margin-right: 0.5rem;
  color: var(--color-secondary);
}

.notebook-link {
  text-decoration: none;
  color: var(--color-primary);
}

.notebook-link:hover {
  text-decoration: underline;
}

.proposal-comments {
  padding: 1.5rem;
}

.comments-title {
  margin-bottom: 1.5rem;
  color: var(--color-secondary);
}

.comment-form {
  margin-bottom: 2.5rem;
}

.comment-form h3 {
  font-size: 1.1rem;
  margin-bottom: 0.75rem;
  color: var(--color-secondary);
}

.comment-input {
  width: 100%;
  padding: 0.75rem;
  border-radius: 4px;
  border: 1px solid var(--color-gray);
  margin-bottom: 1rem;
  font-family: inherit;
  resize: vertical;
}

.login-prompt {
  margin: 2rem 0;
  text-align: center;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.no-comments {
  text-align: center;
  padding: 2rem;
  color: var(--color-gray);
  font-style: italic;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.comment {
  padding: 1.5rem;
  border-radius: 8px;
  background-color: #f8f9fa;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.comment-author {
  display: flex;
  align-items: center;
}

.comment-avatar {
  margin-right: 0.75rem;
}

.comment-avatar img {
  width: 28px;
  height: 28px;
  border-radius: 50%;
}

.comment-author-name {
  font-weight: bold;
}

.comment-date {
  font-size: 0.85rem;
  color: var(--color-gray);
}

.comment-content {
  margin-bottom: 1rem;
  white-space: pre-wrap;
}

.comment-actions {
  display: flex;
  justify-content: flex-end;
}

.btn-link {
  background: none;
  border: none;
  color: var(--color-primary);
  font-size: 0.9rem;
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
}

.btn-link:hover {
  color: #3aa876;
}
</style>