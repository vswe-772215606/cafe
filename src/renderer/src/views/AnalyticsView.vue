<template>
  <BasePage>
    <BaseSectionHeader
      title="Hisobotlar"
      description="Bu sahifada savdo hisobotlarini ko‘rish mumkin."
    />

    <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>

    <BaseCard>
      <div class="filters">
        <BaseInput
          v-model="filters.fromDate"
          label="Boshlanish sanasi"
          type="date"
        />
        <BaseInput
          v-model="filters.toDate"
          label="Tugash sanasi"
          type="date"
        />
        <div class="filter-action">
          <BaseButton :disabled="loading" @click="loadAnalytics">
            <template #icon>
              <RefreshCw />
            </template>
            {{ loading ? 'Yuklanmoqda...' : 'Hisobotni yangilash' }}
          </BaseButton>
        </div>
      </div>
    </BaseCard>

    <BaseCard v-if="loading">
      <p class="state-text">Yuklanmoqda...</p>
    </BaseCard>

    <template v-else>
      <BaseGrid>
        <BaseCard>
          <p class="summary-label">Jami savdo</p>
          <h3 class="summary-value">{{ formatPrice(summary.total_sales) }}</h3>
        </BaseCard>
        <BaseCard>
          <p class="summary-label">Buyurtmalar soni</p>
          <h3 class="summary-value">{{ summary.completed_orders_count }}</h3>
        </BaseCard>
        <BaseCard>
          <p class="summary-label">Sotilgan mahsulotlar soni</p>
          <h3 class="summary-value">{{ summary.total_items_sold }}</h3>
        </BaseCard>
      </BaseGrid>

      <BaseEmptyState
        v-if="hasNoData"
        message="Bu oraliqda ma’lumot topilmadi."
      />

      <div v-else class="analytics-grid">
        <BaseCard>
          <h3 class="section-title">Eng ko‘p sotilgan mahsulotlar</h3>
          <div class="list-block">
            <div v-for="item in topItems" :key="`${item.type}-${item.item_name}`" class="list-row">
              <div>
                <p class="item-title">{{ item.item_name }}</p>
                <p class="item-meta">{{ item.type === 'FOOD' ? 'Taom' : 'Combo' }}</p>
              </div>
              <div class="align-right">
                <p class="item-title">{{ item.total_quantity }} ta</p>
                <p class="item-meta">{{ formatPrice(item.total_sales) }}</p>
              </div>
            </div>
          </div>
        </BaseCard>

        <BaseCard>
          <h3 class="section-title">Mahsulot turi bo‘yicha</h3>
          <div class="list-block">
            <div v-for="item in salesByType" :key="item.type" class="list-row">
              <div>
                <p class="item-title">{{ item.type === 'FOOD' ? 'Taom' : 'Combo' }}</p>
              </div>
              <div class="align-right">
                <p class="item-title">{{ item.total_quantity }} ta</p>
                <p class="item-meta">{{ formatPrice(item.total_sales) }}</p>
              </div>
            </div>
          </div>
        </BaseCard>

        <BaseCard>
          <h3 class="section-title">Buyurtma turi bo‘yicha</h3>
          <div class="list-block">
            <div v-for="item in salesByOrderType" :key="item.order_type" class="list-row">
              <div>
                <p class="item-title">{{ item.order_type === 'DINE_IN' ? 'Zalda' : 'Olib ketish' }}</p>
              </div>
              <div class="align-right">
                <p class="item-title">{{ item.orders_count }} ta</p>
                <p class="item-meta">{{ formatPrice(item.total_sales) }}</p>
              </div>
            </div>
          </div>
        </BaseCard>

        <BaseCard>
          <h3 class="section-title">Stollar bo‘yicha</h3>
          <div class="list-block">
            <div v-for="item in salesByTable" :key="item.table_id" class="list-row">
              <div>
                <p class="item-title">Stol #{{ item.table_number }}</p>
              </div>
              <div class="align-right">
                <p class="item-title">{{ item.completed_orders_count }} ta</p>
                <p class="item-meta">{{ formatPrice(item.total_sales) }}</p>
              </div>
            </div>
          </div>
        </BaseCard>

        <BaseCard>
          <h3 class="section-title">So‘nggi tayyor buyurtmalar</h3>
          <div class="list-block">
            <div v-for="item in recentOrders" :key="item.id" class="list-row">
              <div>
                <p class="item-title">Buyurtma #{{ item.id }}</p>
                <p class="item-meta">
                  {{ item.table_id ? `Stol #${item.table_id}` : 'Olib ketish' }}
                </p>
              </div>
              <div class="align-right">
                <p class="item-title">{{ formatPrice(item.total_price) }}</p>
                <p class="item-meta">{{ formatDate(item.closed_at) }}</p>
              </div>
            </div>
          </div>
        </BaseCard>
      </div>
    </template>
  </BasePage>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { RefreshCw } from 'lucide-vue-next';
import { api } from '../services/api';
import BaseButton from '../components/base/BaseButton.vue';
import BaseCard from '../components/base/BaseCard.vue';
import BaseEmptyState from '../components/base/BaseEmptyState.vue';
import BaseGrid from '../components/base/BaseGrid.vue';
import BaseInput from '../components/base/BaseInput.vue';
import BasePage from '../components/base/BasePage.vue';
import BaseSectionHeader from '../components/base/BaseSectionHeader.vue';

const analyticsApi = window.api.analytics;

const loading = ref(true);
const errorMessage = ref('');
const summary = ref({
  total_sales: 0,
  completed_orders_count: 0,
  total_items_sold: 0,
});
const topItems = ref([]);
const salesByType = ref([]);
const salesByOrderType = ref([]);
const salesByTable = ref([]);
const recentOrders = ref([]);

const today = new Date();
const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

const filters = reactive({
  fromDate: startOfMonth.toISOString().slice(0, 10),
  toDate: today.toISOString().slice(0, 10),
});

const hasNoData = computed(() => {
  return (
    Number(summary.value.total_sales) === 0 &&
    Number(summary.value.completed_orders_count) === 0 &&
    Number(summary.value.total_items_sold) === 0 &&
    topItems.value.length === 0 &&
    salesByType.value.length === 0 &&
    salesByOrderType.value.length === 0 &&
    salesByTable.value.length === 0 &&
    recentOrders.value.length === 0
  );
});

function mapErrorMessage(error) {
  switch (error?.message) {
    case 'INVALID_FROM_DATE':
      return 'Boshlanish sanasi noto‘g‘ri.';
    case 'INVALID_TO_DATE':
      return 'Tugash sanasi noto‘g‘ri.';
    case 'INVALID_DATE_RANGE':
      return 'Sana oralig‘i noto‘g‘ri.';
    case 'INVALID_LIMIT':
      return 'Limit noto‘g‘ri.';
    default:
      return 'Xatolik yuz berdi.';
  }
}

function formatPrice(price) {
  return `${Number(price || 0).toLocaleString('uz-UZ')} so‘m`;
}

function formatDate(value) {
  if (!value) {
    return '';
  }

  return new Date(value).toLocaleString('uz-UZ');
}

async function loadAnalytics() {
  loading.value = true;
  errorMessage.value = '';

  const payload = {
    fromDate: filters.fromDate,
    toDate: filters.toDate,
  };

  try {
    const [
      summaryData,
      topItemsData,
      salesByTypeData,
      salesByOrderTypeData,
      salesByTableData,
      recentOrdersData,
    ] = await Promise.all([
      api.analytics.getSummary(payload),
      api.analytics.getTopItems({ ...payload, limit: 10 }),
      api.analytics.getSalesByType(payload),
      analyticsApi.getSalesByOrderType(payload),
      api.analytics.getSalesByTable(payload),
      api.analytics.getRecent(10),
    ]);

    summary.value = summaryData;
    topItems.value = topItemsData;
    salesByType.value = salesByTypeData;
    salesByOrderType.value = salesByOrderTypeData;
    salesByTable.value = salesByTableData;
    recentOrders.value = recentOrdersData;
  } catch (error) {
    errorMessage.value = mapErrorMessage(error);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadAnalytics();
});
</script>

<style scoped>
.error-text {
  padding: var(--space-3);
  border: 1px solid #fecaca;
  border-radius: var(--radius-1);
  background: #fef2f2;
  color: #b91c1c;
}

.state-text {
  color: var(--color-text-muted);
}

.filters {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-3);
  align-items: end;
}

.filter-action {
  display: flex;
}

.analytics-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
}

.summary-label,
.item-meta {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.summary-value,
.section-title,
.item-title {
  color: var(--color-text);
  font-weight: 700;
}

.summary-value {
  font-size: var(--font-size-xl);
}

.section-title {
  margin-bottom: var(--space-3);
  font-size: var(--font-size-md);
}

.list-block {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.list-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-1);
  background: var(--color-bg-surface-soft);
}

.align-right {
  text-align: right;
}

@media (max-width: 960px) {
  .filters,
  .analytics-grid {
    grid-template-columns: 1fr;
  }
}
</style>
