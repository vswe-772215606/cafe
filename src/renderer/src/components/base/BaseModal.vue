<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="modal">
      <div class="header">
        <h3 class="title">{{ title }}</h3>
        <button class="close-button" type="button" @click="$emit('close')">Yopish</button>
      </div>
      <div class="body">
        <slot />
      </div>
      <div v-if="$slots.footer" class="footer">
        <slot name="footer" />
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true,
  },
});

defineEmits(['close']);
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
  background: var(--color-bg-overlay);
  z-index: 1000;
}

.modal {
  width: min(100%, 440px);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-2);
  background: var(--color-bg-surface);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.18);
}

.header,
.footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
}

.header {
  border-bottom: 1px solid var(--color-border);
}

.footer {
  justify-content: flex-end;
  border-top: 1px solid var(--color-border);
}

.title {
  font-size: var(--font-size-lg);
  font-weight: 700;
}

.body {
  padding: var(--space-4);
}

.close-button {
  min-height: 36px;
  padding: 0 var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-1);
  color: var(--color-text-muted);
}
</style>
