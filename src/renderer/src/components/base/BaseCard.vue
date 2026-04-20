<template>
  <div class="card">
    <slot />
  </div>
</template>

<style scoped>
.card {
  padding: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-2);
  background: var(--color-bg-surface);
  box-shadow: var(--shadow-soft);
}
</style>
