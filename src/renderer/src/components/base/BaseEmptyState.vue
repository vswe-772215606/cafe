<template>
  <div class="empty-state">
    <p class="message">{{ message }}</p>
  </div>
</template>

<script setup>
defineProps({
  message: {
    type: String,
    required: true,
  },
});
</script>

<style scoped>
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 140px;
  padding: var(--space-4);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-2);
  background: var(--color-bg-surface-soft);
}

.message {
  color: var(--color-text-muted);
  text-align: center;
}
</style>
