<template>
  <button :class="['button', `button--${variant}`]" :type="type" :disabled="disabled">
    <slot />
  </button>
</template>

<script setup>
defineProps({
  variant: {
    type: String,
    default: 'primary',
  },
  type: {
    type: String,
    default: 'button',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});
</script>

<style scoped>
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  min-height: 42px;
  padding: 0 var(--space-3);
  border: 1px solid transparent;
  border-radius: var(--radius-1);
  font-size: var(--font-size-sm);
  font-weight: 600;
  transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease, opacity 0.15s ease;
}

.button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.button--primary {
  color: var(--color-text-inverse);
  background: var(--color-primary);
}

.button--primary:not(:disabled):hover {
  background: var(--color-primary-hover);
}

.button--secondary {
  color: var(--color-text);
  background: var(--color-secondary);
  border-color: var(--color-border);
}

.button--secondary:not(:disabled):hover {
  background: var(--color-secondary-hover);
}

.button--danger {
  color: var(--color-text-inverse);
  background: var(--color-danger);
}

.button--danger:not(:disabled):hover {
  background: var(--color-danger-hover);
}

.button--ghost {
  color: var(--color-text);
  background: transparent;
  border-color: var(--color-border);
}

.button--ghost:not(:disabled):hover {
  background: var(--color-bg-surface-soft);
}
</style>
