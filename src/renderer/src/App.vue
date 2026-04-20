<template>
  <div class="app-layout">
    <aside class="sidebar">
      <div class="brand">
        <h1 class="brand-title">Cafe boshqaruvi</h1>
        <p class="brand-text">Bo‘limni tanlang</p>
      </div>

      <nav class="nav">
        <RouterLink to="/food-groups" class="nav-link">Menyu</RouterLink>
        <RouterLink to="/foods" class="nav-link">Taomlar</RouterLink>
        <RouterLink to="/tables" class="nav-link">Stollar</RouterLink>
        <RouterLink to="/combos" class="nav-link">Combo</RouterLink>
        <RouterLink to="/orders" class="nav-link">Buyurtmalar</RouterLink>
        <RouterLink to="/analytics" class="nav-link">Hisobotlar</RouterLink>
      </nav>
    </aside>

    <main class="content">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { RouterLink, RouterView } from 'vue-router';
</script>

<style scoped>
.app-layout {
  display: grid;
  grid-template-columns: 240px 1fr;
  min-height: 100vh;
  background: #f3f4f6;
  color: #1f2937;
}

.sidebar {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 24px 18px;
  background: #111827;
  color: #f9fafb;
}

.brand {
  padding: 8px 10px;
}

.brand-title {
  margin: 0 0 8px;
  font-size: 22px;
  font-weight: 700;
}

.brand-text {
  margin: 0;
  font-size: 14px;
  color: #9ca3af;
}

.nav {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.nav-link {
  padding: 12px 14px;
  border-radius: 10px;
  color: #d1d5db;
  text-decoration: none;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.nav-link:hover {
  background: #1f2937;
  color: #ffffff;
}

.nav-link.router-link-active {
  background: #2563eb;
  color: #ffffff;
}

.content {
  padding: 32px;
}

@media (max-width: 900px) {
  .app-layout {
    grid-template-columns: 1fr;
  }

  .sidebar {
    gap: 16px;
  }

  .nav {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .content {
    padding: 20px;
  }
}
</style>
