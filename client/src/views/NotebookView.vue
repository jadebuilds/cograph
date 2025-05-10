<template>
  <div class="py-6">
    <div v-if="loading" class="flex justify-center items-center py-8">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
    <div v-else-if="error" class="bg-red-50 border border-red-200 text-red-600 p-4 rounded-md">
      {{ error }}
    </div>
    <div v-else-if="notebook" class="container mx-auto px-4">
      <!-- Notebook header -->
      <header class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 mb-2">{{ notebookTitle }}</h1>
          <div class="text-sm text-gray-500">
            <span class="font-medium">Path:</span> {{ notebook.filePath }}
          </div>
        </div>
        <div class="mt-4 md:mt-0 flex gap-3">
          <button
            v-if="isAuthenticated"
            @click="createProposal"
            class="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-md transition duration-200"
          >
            Create Proposal
          </button>
        </div>
      </header>

      <!-- Notebook content -->
      <div class="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div class="flex items-center justify-between border-b border-gray-200 px-4 py-3 bg-gray-50">
          <h2 class="text-lg font-medium text-gray-900">Notebook Contents</h2>
          <div class="text-sm text-gray-500">
            <span v-if="notebookLoaded" class="text-green-600">Loaded</span>
            <span v-else class="text-gray-400">Loading content...</span>
          </div>
        </div>

        <!-- Notebook renderer component -->
        <NotebookRenderer
          :notebookId="props.id"
          @comment-click="openCommentModal"
          @loaded="onNotebookLoaded"
        />
      </div>

      <!-- Proposals section -->
      <section class="mt-10">
        <h2 class="text-2xl font-bold text-gray-900 mb-4">Proposals for this Notebook</h2>
        <div v-if="notebook.proposals && notebook.proposals.length > 0" class="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="proposal in notebook.proposals"
            :key="proposal.id"
            class="bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-200 hover:-translate-y-1"
          >
            <div class="border-b border-gray-100 px-4 py-3 flex justify-between items-start">
              <h3 class="font-medium text-gray-900 pr-3">
                <RouterLink
                  :to="`/proposals/${proposal.id}`"
                  class="hover:text-primary transition duration-200"
                >
                  {{ proposal.title }}
                </RouterLink>
              </h3>
              <span
                class="text-xs font-medium px-2 py-1 rounded-full capitalize"
                :class="{
                  'bg-blue-100 text-blue-800': proposal.status === 'ACTIVE',
                  'bg-gray-100 text-gray-800': proposal.status === 'DRAFT',
                  'bg-green-100 text-green-800': proposal.status === 'PASSED',
                  'bg-red-100 text-red-800': proposal.status === 'REJECTED',
                  'bg-gray-200 text-gray-600': proposal.status === 'EXPIRED',
                }"
              >
                {{ proposal.status.toLowerCase() }}
              </span>
            </div>
            <div class="px-4 py-3">
              <div class="flex items-center text-sm text-gray-600 mb-1">
                <span class="font-medium">Created by:</span>
                <span class="ml-2">{{ proposal.author.name }}</span>
              </div>
              <div class="text-xs text-gray-500">
                {{ formatDate(proposal.createdAt) }}
              </div>
            </div>
          </div>
        </div>
        <div v-else class="bg-gray-50 rounded-lg p-8 text-center text-gray-500 italic">
          No proposals have been created for this notebook yet.
        </div>
      </section>
    </div>

    <!-- Comment modal -->
    <CommentModal
      :is-open="commentModalOpen"
      :thread-id="commentThreadId"
      :cell-id="commentCellId"
      :cell-content="commentCellContent"
      :notebook-id="props.id"
      @close="closeCommentModal"
      @comment-added="onCommentAdded"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { trpc } from '../utils/trpc'
import NotebookRenderer from '../components/NotebookRenderer.vue'
import CommentModal from '../components/CommentModal.vue'

// Props
const props = defineProps<{
  id: string
}>()

const router = useRouter()
const authStore = useAuthStore()

// Types
interface Author {
  id: string
  name: string
  avatarUrl?: string
}

interface Proposal {
  id: string
  title: string
  status: string
  author: Author
  createdAt: string
}

interface Notebook {
  id: string
  filePath: string
  proposals: Proposal[]
}

// State
const notebook = ref<Notebook | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const notebookLoaded = ref(false)

// Comment modal state
const commentModalOpen = ref(false)
const commentThreadId = ref<string | undefined>(undefined)
const commentCellId = ref<string | undefined>(undefined)
const commentCellContent = ref<string | undefined>(undefined)

// Computed
const isAuthenticated = computed(() => authStore.isAuthenticated)

const notebookTitle = computed(() => {
  if (!notebook.value) return ''

  // Extract the filename from the path
  const parts = notebook.value.filePath.split('/')
  const filename = parts[parts.length - 1]

  // Remove file extension if present
  return filename.replace(/\.[^/.]+$/, '')
})

// Lifecycle
onMounted(async () => {
  await fetchNotebook()
})

// Methods
const fetchNotebook = async () => {
  loading.value = true
  error.value = null

  try {
    // In a real app, we would use tRPC to fetch the notebook
    // const data = await trpc.notebook.get.query({ id: props.id })

    // For demo, we'll use mock data
    await new Promise(resolve => setTimeout(resolve, 500))

    // Mock notebook metadata
    notebook.value = {
      id: props.id,
      filePath: `/static/notebooks/sample.ipynb`,
      proposals: [
        {
          id: '1',
          title: 'Add improved visualizations for data analysis',
          status: 'ACTIVE',
          author: {
            id: 'user1',
            name: 'User One',
            avatarUrl: '',
          },
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          title: 'Fix data preprocessing issues in calculation cells',
          status: 'DRAFT',
          author: {
            id: 'user2',
            name: 'User Two',
            avatarUrl: '',
          },
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    }
  } catch (err) {
    error.value = 'Failed to load notebook data'
    console.error(err)
  } finally {
    loading.value = false
  }
}

const createProposal = () => {
  // Navigate to the create proposal page with notebook id
  router.push({
    name: 'proposal-create',
    query: { notebookId: props.id }
  })
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date)
}

// Comment handling
const openCommentModal = (data: { cellId: string, cellIndex: number, cellContent: string }) => {
  // Reset state
  commentThreadId.value = undefined

  // Set new data
  commentCellId.value = data.cellId
  commentCellContent.value = data.cellContent

  // Open modal
  commentModalOpen.value = true
}

const closeCommentModal = () => {
  commentModalOpen.value = false

  // Clear data after closing
  setTimeout(() => {
    commentThreadId.value = undefined
    commentCellId.value = undefined
    commentCellContent.value = undefined
  }, 200)
}

const onCommentAdded = (commentId: string) => {
  // In a real app, we might refresh comments or update the UI
  console.log('Comment added:', commentId)
}

const onNotebookLoaded = () => {
  notebookLoaded.value = true
}
</script>