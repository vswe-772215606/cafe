<template>
  <section class="base-page">
    <slot />
  </section>
</template>

<style scoped>
.base-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
</style>
