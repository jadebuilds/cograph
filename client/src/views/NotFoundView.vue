<template>
  <div class="not-found">
    <h1>404</h1>
    <p>Page not found</p>
    <RouterLink to="/" class="btn">Go Home</RouterLink>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<style scoped>
.not-found {
  text-align: center;
  padding: 4rem 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
}

h1 {
  font-size: 6rem;
  margin: 0;
  color: var(--color-primary);
}

p {
  font-size: 1.5rem;
  margin: 1rem 0 2rem;
  color: var(--color-secondary);
}
</style>