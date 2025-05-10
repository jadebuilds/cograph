<template>
  <div class="discussion-view">
    <div v-if="loading" class="loading">Loading discussion...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="comment" class="discussion-container">
      <div class="discussion-actions">
        <RouterLink :to="`/proposals/${comment.proposalId}`" class="btn-back">
          &larr; Back to Proposal
        </RouterLink>
      </div>
      
      <div class="parent-comment card">
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
      </div>
      
      <div class="replies-container card">
        <h2 class="replies-title">Replies ({{ comment.replies.length }})</h2>
        
        <div v-if="isAuthenticated" class="reply-form">
          <h3>Add your reply</h3>
          <textarea 
            v-model="newReply" 
            placeholder="Write your reply..."
            rows="4"
            class="reply-input"
          ></textarea>
          <button @click="submitReply" class="btn" :disabled="!newReply.trim()">
            Post Reply
          </button>
        </div>
        
        <div v-else class="login-prompt">
          <RouterLink to="/login" class="btn">Login to Reply</RouterLink>
        </div>
        
        <div v-if="comment.replies.length === 0" class="no-replies">
          No replies yet. Be the first to reply!
        </div>
        
        <div v-else class="replies-list">
          <div v-for="reply in comment.replies" :key="reply.id" class="reply">
            <div class="reply-header">
              <div class="reply-author">
                <span v-if="reply.author.avatarUrl" class="reply-avatar">
                  <img :src="reply.author.avatarUrl" alt="Author avatar" />
                </span>
                <span class="reply-author-name">{{ reply.author.name }}</span>
              </div>
              <span class="reply-date">{{ formatDate(reply.createdAt) }}</span>
            </div>
            
            <div class="reply-content">{{ reply.content }}</div>
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

// Props
const props = defineProps<{
  id: string
}>()

const authStore = useAuthStore()

interface Author {
  id: string
  name: string
  avatarUrl?: string
}

interface Reply {
  id: string
  author: Author
  content: string
  createdAt: string
}

interface Comment {
  id: string
  proposalId: string
  author: Author
  content: string
  createdAt: string
  replies: Reply[]
}

const comment = ref<Comment | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const newReply = ref('')

const isAuthenticated = computed(() => authStore.isAuthenticated)

onMounted(async () => {
  await fetchComment()
})

const fetchComment = async () => {
  loading.value = true
  error.value = null
  
  try {
    // In a real app, you would use your tRPC client here
    // For now, we'll simulate fetching comment data
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Mock data
    comment.value = {
      id: props.id,
      proposalId: 'proposal1',
      author: {
        id: 'user2',
        name: 'User Two',
        avatarUrl: '',
      },
      content: 'This is a great proposal! I fully support adding these visualizations.',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      replies: [
        {
          id: 'reply1',
          author: {
            id: 'user1',
            name: 'User One',
            avatarUrl: '',
          },
          content: 'Thank you for your support! I'm glad you like the idea.',
          createdAt: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'reply2',
          author: {
            id: 'user3',
            name: 'User Three',
            avatarUrl: '',
          },
          content: 'I agree! The visualizations will make the data much easier to understand.',
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        }
      ]
    }
  } catch (err) {
    error.value = 'Failed to load comment data'
    console.error(err)
  } finally {
    loading.value = false
  }
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

const submitReply = async () => {
  if (!newReply.value.trim() || !isAuthenticated.value) return
  
  try {
    // In a real app, you would use your tRPC client here
    // For now, we'll simulate adding a reply
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // Add reply to the list
    if (comment.value) {
      comment.value.replies.push({
        id: `reply-${Date.now()}`,
        author: {
          id: authStore.user?.id || 'current-user',
          name: authStore.user?.name || 'Current User',
          avatarUrl: authStore.user?.avatarUrl,
        },
        content: newReply.value,
        createdAt: new Date().toISOString(),
      })
      
      // Clear input
      newReply.value = ''
    }
  } catch (err) {
    console.error('Failed to post reply:', err)
    // Show error message to user in a real app
  }
}
</script>

<style scoped>
.discussion-view {
  padding: 1rem 0;
}

.loading, .error {
  text-align: center;
  padding: 2rem;
}

.error {
  color: var(--color-danger);
}

.discussion-actions {
  display: flex;
  justify-content: flex-start;
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

.parent-comment {
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  background-color: #f8f9fa;
}

.comment-header, .reply-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.comment-author, .reply-author {
  display: flex;
  align-items: center;
}

.comment-avatar, .reply-avatar {
  margin-right: 0.75rem;
}

.comment-avatar img, .reply-avatar img {
  width: 28px;
  height: 28px;
  border-radius: 50%;
}

.comment-author-name, .reply-author-name {
  font-weight: bold;
}

.comment-date, .reply-date {
  font-size: 0.85rem;
  color: var(--color-gray);
}

.comment-content, .reply-content {
  white-space: pre-wrap;
}

.replies-container {
  padding: 1.5rem;
}

.replies-title {
  margin-bottom: 1.5rem;
  color: var(--color-secondary);
}

.reply-form {
  margin-bottom: 2.5rem;
}

.reply-form h3 {
  font-size: 1.1rem;
  margin-bottom: 0.75rem;
  color: var(--color-secondary);
}

.reply-input {
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

.no-replies {
  text-align: center;
  padding: 2rem;
  color: var(--color-gray);
  font-style: italic;
}

.replies-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.reply {
  padding: 1.25rem;
  border-radius: 8px;
  background-color: #f8f9fa;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
</style>