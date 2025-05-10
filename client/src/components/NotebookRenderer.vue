<template>
  <div class="notebook-container">
    <!-- Loading state -->
    <div v-if="loading" class="flex justify-center items-center py-8">
      <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
    </div>
    
    <!-- Error state -->
    <div v-else-if="error" class="text-center py-8">
      <div class="text-red-500 mb-4">{{ error }}</div>
      <button @click="loadNotebook" class="text-primary hover:text-primary-dark">
        Try again
      </button>
    </div>
    
    <!-- Notebook content -->
    <div v-else-if="notebook" class="notebook-content">
      <div v-for="(cell, index) in notebook.cells" :key="`cell-${index}`" class="notebook-cell mb-4">
        <!-- Cell toolbar -->
        <div class="cell-toolbar flex justify-between items-center px-2 py-1 bg-gray-100 border border-gray-200 rounded-t-md">
          <div class="cell-type text-sm text-gray-500">
            {{ cell.cell_type === 'code' ? 'Code' : 'Markdown' }}
          </div>
          <button 
            @click="openCommentModal(cell, index)" 
            class="text-gray-500 hover:text-primary"
            title="Add comment"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
          </button>
        </div>
        
        <!-- Cell content -->
        <div 
          class="cell-content relative border border-t-0 border-gray-200 rounded-b-md p-4"
          :class="{'bg-gray-50': cell.cell_type === 'code'}"
        >
          <!-- Markdown cell -->
          <div v-if="cell.cell_type === 'markdown'" class="markdown-content prose max-w-none">
            <div v-html="renderMarkdown(cell.source.join(''))"></div>
          </div>
          
          <!-- Code cell -->
          <div v-else class="code-cell">
            <!-- Input -->
            <pre class="bg-gray-900 text-white p-3 rounded-md overflow-x-auto"><code>{{ cell.source.join('') }}</code></pre>
            
            <!-- Output (if any) -->
            <div v-if="cell.outputs && cell.outputs.length > 0" class="cell-outputs mt-2 border-t border-gray-200 pt-2">
              <div v-for="(output, i) in cell.outputs" :key="`output-${index}-${i}`" class="output">
                <!-- Text output -->
                <pre v-if="output.output_type === 'stream'" class="bg-gray-100 p-2 rounded-md overflow-x-auto mt-2"><code>{{ output.text.join('') }}</code></pre>
                
                <!-- Execute result -->
                <div v-else-if="output.output_type === 'execute_result'" class="mt-2">
                  <pre class="bg-gray-100 p-2 rounded-md overflow-x-auto"><code>{{ formatOutput(output) }}</code></pre>
                </div>
                
                <!-- Error output -->
                <pre v-else-if="output.output_type === 'error'" class="bg-red-50 text-red-600 p-2 rounded-md overflow-x-auto mt-2"><code>{{ output.traceback.join('') }}</code></pre>
                
                <!-- Display data (like images) -->
                <div v-else-if="output.output_type === 'display_data'" class="mt-2">
                  <!-- We would handle different mime types here, for simplicity we'll just show text -->
                  <pre v-if="output.data['text/plain']" class="bg-gray-100 p-2 rounded-md overflow-x-auto"><code>{{ output.data['text/plain'].join('') }}</code></pre>
                  
                  <!-- Images would be handled here -->
                  <img 
                    v-if="output.data['image/png']" 
                    :src="`data:image/png;base64,${output.data['image/png']}`" 
                    class="my-2 max-w-full"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <!-- Comment highlights -->
          <div v-for="comment in getCellComments(index)" :key="comment.id" class="comment-highlight absolute inset-0 pointer-events-none">
            <!-- Implement highlight visualization here -->
            <div class="absolute right-0 top-0 z-10 bg-yellow-200 p-1 text-xs font-medium text-yellow-800 rounded-bl-md">
              {{ comment.count }} 
              <span class="hidden sm:inline">comments</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, defineEmits, defineProps } from 'vue'
import { marked } from 'marked'
import { useRoute } from 'vue-router'

const props = defineProps<{
  notebookId: string
}>()

const emit = defineEmits<{
  (e: 'comment-click', data: { cellId: string, cellIndex: number, cellContent: string }): void
  (e: 'loaded'): void
}>()

// Local state
const loading = ref(true)
const error = ref<string | null>(null)
const notebook = ref<any>(null) // In a real app, we would use proper typing

// Comments state - in a real app, these would come from the backend
const cellComments = ref<Array<{ 
  id: string, 
  cellIndex: number, 
  count: number 
}>>([])

// When component mounts, load the notebook
onMounted(() => {
  loadNotebook()
})

// Load notebook data
const loadNotebook = async () => {
  loading.value = true
  error.value = null
  
  try {
    // In a real app, we would use tRPC to fetch the notebook
    // const result = await trpc.notebook.get.query({ id: props.notebookId })
    
    // For demo, we'll fetch a sample notebook
    const response = await fetch('/static/notebooks/sample.ipynb')
    
    if (!response.ok) {
      throw new Error('Failed to load notebook')
    }
    
    notebook.value = await response.json()
    
    // Simulate loading comments
    await loadComments()
    
    emit('loaded')
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load notebook'
    console.error('Notebook loading error:', err)
  } finally {
    loading.value = false
  }
}

// Load comments for this notebook
const loadComments = async () => {
  try {
    // In a real app, we would use tRPC
    // const comments = await trpc.comments.listByNotebook.query({ notebookId: props.notebookId })
    
    // For demo, we'll use mock data
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // Mock some comments
    cellComments.value = [
      { id: 'comment1', cellIndex: 1, count: 3 },
      { id: 'comment2', cellIndex: 3, count: 1 }
    ]
  } catch (err) {
    console.error('Comment loading error:', err)
  }
}

// Get comments for a specific cell
const getCellComments = (cellIndex: number) => {
  return cellComments.value.filter(comment => comment.cellIndex === cellIndex)
}

// Open comment modal for a cell
const openCommentModal = (cell: any, index: number) => {
  // Get the cell ID or generate one if needed
  const cellId = cell.id || `cell-${index}`
  
  // Find existing comments for this cell
  const existingComment = cellComments.value.find(c => c.cellIndex === index)
  
  emit('comment-click', {
    cellId,
    cellIndex: index,
    cellContent: cell.source.join('').substring(0, 150) + (cell.source.join('').length > 150 ? '...' : '')
  })
}

// Format cell output (simplified)
const formatOutput = (output: any) => {
  if (output.data && output.data['text/plain']) {
    return output.data['text/plain'].join('')
  }
  return JSON.stringify(output, null, 2)
}

// Render markdown content
const renderMarkdown = (source: string) => {
  return marked(source)
}
</script>

<style>
/* Add any additional component styles here */
.prose {
  @apply text-gray-900 max-w-none;
}

.prose h1 {
  @apply text-2xl font-bold mb-4;
}

.prose h2 {
  @apply text-xl font-bold mb-3;
}

.prose h3 {
  @apply text-lg font-bold mb-2;
}

.prose p {
  @apply mb-4;
}

.prose ul, .prose ol {
  @apply mb-4 pl-5;
}

.prose li {
  @apply mb-1;
}

.prose pre {
  @apply bg-gray-100 p-3 rounded-md overflow-x-auto mb-4;
}

.prose code {
  @apply font-mono text-sm bg-gray-100 px-1 rounded;
}

.prose pre code {
  @apply bg-transparent p-0;
}

.prose blockquote {
  @apply border-l-4 border-gray-300 pl-4 italic;
}
</style>