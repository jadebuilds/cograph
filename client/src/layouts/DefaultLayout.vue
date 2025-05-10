<template>
  <div class="flex flex-col min-h-screen">
    <NavBar />
    <main class="flex-1 px-4 py-6 max-w-7xl mx-auto w-full">
      <RouterView />
    </main>
    <footer class="bg-gray-100 border-t border-gray-200 py-4">
      <div class="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
        <p>&copy; {{ currentYear }} cograph.dev | Collaborative notebook proposals</p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterView } from 'vue-router'
import NavBar from '../components/NavBar.vue'

const currentYear = computed(() => new Date().getFullYear())
</script>