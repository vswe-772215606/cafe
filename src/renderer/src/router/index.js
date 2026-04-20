import { createRouter, createWebHashHistory } from 'vue-router';
import FoodGroupsView from '../views/FoodGroupsView.vue';
import FoodsView from '../views/FoodsView.vue';
import TablesView from '../views/TablesView.vue';
import CombosView from '../views/CombosView.vue';
import OrdersView from '../views/OrdersView.vue';
import AnalyticsView from '../views/AnalyticsView.vue';
import SettingsView from '../views/SettingsView.vue';

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      redirect: '/food-groups',
    },
    {
      path: '/food-groups',
      component: FoodGroupsView,
    },
    {
      path: '/foods',
      component: FoodsView,
    },
    {
      path: '/tables',
      component: TablesView,
    },
    {
      path: '/combos',
      component: CombosView,
    },
    {
      path: '/orders',
      component: OrdersView,
    },
    {
      path: '/analytics',
      component: AnalyticsView,
    },
    {
      path: '/settings',
      component: SettingsView,
    },
  ],
});

export default router;
