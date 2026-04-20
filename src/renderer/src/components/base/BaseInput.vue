<template>
  <label class="field">
    <span v-if="label" class="label">{{ label }}</span>
    <input
      :value="modelValue"
      class="input"
      :type="type"
      :placeholder="placeholder"
      @input="$emit('update:modelValue', $event.target.value)"
    />
  </label>
</template>

<script setup>
defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  label: {
    type: String,
    default: '',
  },
  placeholder: {
    type: String,
    default: '',
  },
  type: {
    type: String,
    default: 'text',
  },
});

defineEmits(['update:modelValue']);
</script>

<style scoped>
.field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.label {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-text);
}

.input {
  width: 100%;
  min-width: 0;
  padding: 0 var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-1);
  color: var(--color-text);
  background: var(--color-bg-surface);
}

.input:focus {
  outline: none;
  border-color: var(--color-primary);
}
</style>
