<template>
  <teleport to="body">
    <div 
      v-if="isOpen" 
      class="fixed inset-0 z-50 overflow-y-auto"
      @click="closeModal"
    >
      <!-- Overlay -->
      <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity"></div>
      
      <!-- Modal dialog -->
      <div class="flex min-h-screen items-center justify-center p-4">
        <div 
          class="relative w-full max-w-2xl transform overflow-hidden rounded-lg bg-white shadow-xl transition-all"
          @click.stop
        >
          <!-- Header -->
          <div class="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
            <h3 class="text-lg font-medium text-gray-900">
              {{ isNewComment ? 'Add New Comment' : 'Comment Thread' }}
            </h3>
            <button 
              type="button" 
              class="rounded-md bg-white text-gray-400 hover:text-gray-500"
              @click="closeModal"
            >
              <span class="sr-only">Close</span>
              <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <!-- Cell content preview -->
          <div v-if="cellContent" class="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <div class="font-mono text-xs overflow-x-auto whitespace-pre-wrap bg-gray-100 p-2 rounded">
              {{ cellContent }}
            </div>
          </div>
          
          <!-- Comment section -->
          <div class="px-4 py-4">
            <!-- Existing comment thread -->
            <div v-if="!isNewComment && comments.length > 0" class="space-y-4 mb-6">
              <div v-for="comment in comments" :key="comment.id" class="bg-gray-50 p-3 rounded-lg">
                <div class="flex items-center mb-2">
                  <div class="font-medium">{{ comment.author.name }}</div>
                  <span class="mx-2 text-gray-400">•</span>
                  <div class="text-sm text-gray-500">{{ formatDate(comment.createdAt) }}</div>
                </div>
                <div class="text-gray-800 whitespace-pre-wrap">{{ comment.content }}</div>
              </div>
            </div>
            
            <!-- Comment form -->
            <div v-if="isAuthenticated">
              <textarea
                v-model="newCommentText"
                placeholder="Add your comment..."
                rows="4"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              ></textarea>
              <div class="mt-4 flex justify-end">
                <button
                  class="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md mr-2"
                  @click="closeModal"
                >
                  Cancel
                </button>
                <button
                  :disabled="!newCommentText.trim() || isSaving"
                  class="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-md disabled:opacity-50"
                  @click="submitComment"
                >
                  {{ isSaving ? 'Posting...' : 'Post Comment' }}
                </button>
              </div>
            </div>
            <div v-else class="mt-4 text-center">
              <p class="text-gray-600 mb-2">Please log in to add comments</p>
              <RouterLink to="/login" class="text-primary hover:text-primary-dark font-medium">
                Log in
              </RouterLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { ref, defineProps, defineEmits, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const props = defineProps<{
  isOpen: boolean
  threadId?: string
  cellId?: string
  selectionRange?: { start: number; end: number }
  cellContent?: string
  notebookId: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'comment-added', commentId: string): void
}>()

// Store references
const authStore = useAuthStore()
const isAuthenticated = computed(() => authStore.isAuthenticated)

// Local state
const newCommentText = ref('')
const isSaving = ref(false)
const comments = ref<Array<{
  id: string
  content: string
  author: { id: string; name: string }
  createdAt: string
}>>([])

// Computed
const isNewComment = computed(() => !props.threadId)

// Methods
const closeModal = () => {
  emit('close')
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

// Load comment thread when threadId changes
watch(() => props.threadId, async (newId) => {
  if (newId) {
    await fetchComments(newId)
  } else {
    comments.value = []
  }
})

// Fetch comments for a thread
const fetchComments = async (threadId: string) => {
  try {
    // In a real app, you would use tRPC client to fetch comments
    // For now, let's use mock data
    await new Promise(resolve => setTimeout(resolve, 300))
    
    comments.value = [
      {
        id: 'comment1',
        content: 'I think we should revise this calculation. The formula seems incorrect.',
        author: { id: 'user1', name: 'User One' },
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'comment2',
        content: 'Good catch! We should use the adjusted formula instead.',
        author: { id: 'user2', name: 'User Two' },
        createdAt: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000).toISOString(),
      }
    ]
  } catch (error) {
    console.error('Error fetching comments:', error)
  }
}

// Submit a new comment
const submitComment = async () => {
  if (!newCommentText.value.trim() || !isAuthenticated.value) return
  
  isSaving.value = true
  
  try {
    // In a real app, you would use tRPC client
    // For new comments:
    // trpc.comments.create.mutate({
    //   notebookId: props.notebookId,
    //   cellId: props.cellId,
    //   content: newCommentText.value,
    //   range: props.selectionRange
    // })
    
    // For replies:
    // trpc.comments.addReply.mutate({
    //   threadId: props.threadId,
    //   content: newCommentText.value,
    // })
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Add to local state for demo purposes
    const newComment = {
      id: `comment-${Date.now()}`,
      content: newCommentText.value,
      author: {
        id: authStore.user?.id || 'current-user',
        name: authStore.user?.name || 'Current User'
      },
      createdAt: new Date().toISOString()
    }
    
    if (isNewComment.value) {
      // For new comments, we would typically close the modal and refresh the notebook view
      emit('comment-added', newComment.id)
      closeModal()
    } else {
      // For replies, add to the existing thread
      comments.value.push(newComment)
    }
    
    // Clear the text input
    newCommentText.value = ''
  } catch (error) {
    console.error('Error saving comment:', error)
  } finally {
    isSaving.value = false
  }
}
</script>

<script lang="ts">
import { computed } from 'vue'
</script>