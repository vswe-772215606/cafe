<template>
  <div :class="['app-layout', isCollapsed ? 'app-layout--collapsed' : '']">
    <aside :class="['sidebar', isCollapsed ? 'sidebar--collapsed' : '']">
      <div class="sidebar-top">
        <div class="brand">
          <h1 v-if="!isCollapsed" class="brand-title">Cafe boshqaruvi</h1>
          <p v-if="!isCollapsed" class="brand-text">Bo‘limni tanlang</p>
        </div>

        <button
          class="toggle-button"
          type="button"
          :aria-label="isCollapsed ? 'Yon panelni ochish' : 'Yon panelni yig‘ish'"
          @click="isCollapsed = !isCollapsed"
        >
          <PanelLeftClose v-if="!isCollapsed" class="toggle-icon" />
          <PanelLeftOpen v-else class="toggle-icon" />
        </button>
      </div>

      <nav class="nav">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          :class="['nav-link', isCollapsed ? 'nav-link--collapsed' : '']"
        >
          <component :is="item.icon" class="nav-icon" />
          <span v-if="!isCollapsed" class="nav-label">{{ item.label }}</span>
        </RouterLink>
      </nav>
    </aside>

    <main class="content">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { RouterLink, RouterView } from 'vue-router';
import {
  BarChart3,
  FolderOpen,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  ReceiptText,
  Settings,
  TableProperties,
  UtensilsCrossed,
} from 'lucide-vue-next';

const isCollapsed = ref(true);

const navItems = [
  { to: '/food-groups', label: 'Menyu', icon: FolderOpen },
  { to: '/foods', label: 'Taomlar', icon: UtensilsCrossed },
  { to: '/tables', label: 'Stollar', icon: TableProperties },
  { to: '/combos', label: 'Combo', icon: Package },
  { to: '/orders', label: 'Buyurtmalar', icon: ReceiptText },
  { to: '/analytics', label: 'Hisobotlar', icon: BarChart3 },
  { to: '/settings', label: 'Sozlamalar', icon: Settings },
];
</script>

<style scoped>
.app-layout {
  display: grid;
  grid-template-columns: 200px 1fr;
  min-height: 100vh;
  background: #f3f4f6;
  color: #1f2937;
  transition: grid-template-columns 0.18s ease;
}

.app-layout--collapsed {
  grid-template-columns: 76px 1fr;
}

.sidebar {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 18px 12px;
  background: #111827;
  color: #f9fafb;
  transition: padding 0.18s ease;
}

.sidebar--collapsed {
  padding-inline: 10px;
}

.sidebar-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.brand {
  min-height: 52px;
  padding: 6px 8px;
  overflow: hidden;
}

.brand-title {
  margin: 0 0 6px;
  font-size: 18px;
  font-weight: 700;
}

.brand-text {
  margin: 0;
  font-size: 13px;
  color: #9ca3af;
}

.toggle-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border: 1px solid #374151;
  border-radius: 8px;
  background: #1f2937;
  color: #f9fafb;
  flex: 0 0 auto;
}

.toggle-button:hover {
  background: #273244;
}

.toggle-icon {
  width: 18px;
  height: 18px;
}

.nav {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.nav-link {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 48px;
  padding: 10px 12px;
  border-radius: 8px;
  color: #d1d5db;
  text-decoration: none;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.nav-link--collapsed {
  justify-content: center;
  padding-inline: 0;
}

.nav-link:hover {
  background: #1f2937;
  color: #ffffff;
}

.nav-link.router-link-active {
  background: #2563eb;
  color: #ffffff;
}

.nav-icon {
  width: 18px;
  height: 18px;
  flex: 0 0 auto;
}

.nav-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.content {
  min-width: 0;
  padding: 20px;
}

@media (max-width: 900px) {
  .app-layout {
    grid-template-columns: 1fr;
  }

  .sidebar {
    gap: 16px;
  }

  .sidebar-top {
    align-items: center;
  }

  .nav {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .nav-link--collapsed {
    padding-inline: 12px;
  }

  .content {
    padding: 20px;
  }
}
</style>
