<template>
  <BasePage>
    <BaseSectionHeader title="Hisobotlar" />

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
          <BaseButton :disabled="loading" @click="refreshAll">
            <template #icon>
              <RefreshCw />
            </template>
            {{ loading ? 'Yuklanmoqda...' : 'Hisobotni yangilash' }}
          </BaseButton>
          <BaseButton
            variant="secondary"
            :disabled="loading || exporting"
            @click="exportToExcel"
          >
            <template #icon>
              <FileDown />
            </template>
            {{ exporting ? 'Yuklanmoqda...' : 'Excelga eksport' }}
          </BaseButton>
        </div>
      </div>
    </BaseCard>

    <BaseCard v-if="loading">
      <p class="state-text">Yuklanmoqda...</p>
    </BaseCard>

    <template v-else>
      <div class="summary-grid">
        <BaseCard>
          <p class="summary-label">Jami savdo</p>
          <h3 class="summary-value">{{ formatPrice(summary.total_sales) }}</h3>
        </BaseCard>
        <BaseCard>
          <p class="summary-label">Buyurtmalar soni</p>
          <h3 class="summary-value">{{ Number(summary.completed_orders_count || 0) }}</h3>
        </BaseCard>
        <BaseCard>
          <p class="summary-label">Sotilgan mahsulotlar soni</p>
          <h3 class="summary-value">{{ Number(summary.total_items_sold || 0) }}</h3>
        </BaseCard>
      </div>

      <div class="analytics-grid">
        <BaseCard>
          <div class="card-head">
            <h3 class="section-title">Eng ko‘p sotilgan mahsulotlar</h3>
            <span class="count-pill">{{ topItemsState.total }}</span>
          </div>

          <div v-if="topItemsState.items.length === 0" class="empty-text">
            Bu oraliqda ma’lumot topilmadi.
          </div>

          <div v-else class="list-block">
            <div
              v-for="item in topItemsState.items"
              :key="`${item.type}-${item.item_name}`"
              class="list-row"
            >
              <div class="list-left">
                <p class="item-title">{{ item.item_name }}</p>
                <p class="item-meta">{{ typeLabel(item.type) }}</p>
              </div>
              <div class="list-right">
                <p class="item-title">{{ item.total_quantity }} ta</p>
                <p class="item-meta">{{ formatPrice(item.total_sales) }}</p>
              </div>
            </div>
          </div>

          <div v-if="topItemsState.totalPages > 1" class="pager">
            <button
              type="button"
              class="pager-btn"
              :disabled="topItemsState.page <= 1 || sectionLoading.topItems"
              @click="loadTopItems(topItemsState.page - 1)"
            >
              <ChevronLeft />
              <span>Oldingi</span>
            </button>
            <span class="pager-indicator">
              Sahifa {{ topItemsState.page }} / {{ topItemsState.totalPages }}
            </span>
            <button
              type="button"
              class="pager-btn"
              :disabled="topItemsState.page >= topItemsState.totalPages || sectionLoading.topItems"
              @click="loadTopItems(topItemsState.page + 1)"
            >
              <span>Keyingi</span>
              <ChevronRight />
            </button>
          </div>
        </BaseCard>

        <BaseCard>
          <div class="card-head">
            <h3 class="section-title">Mahsulot turi bo‘yicha</h3>
          </div>

          <div v-if="salesByType.length === 0" class="empty-text">
            Bu oraliqda ma’lumot topilmadi.
          </div>

          <div v-else class="list-block">
            <div v-for="item in salesByType" :key="item.type" class="list-row">
              <div class="list-left">
                <p class="item-title">{{ typeLabel(item.type) }}</p>
              </div>
              <div class="list-right">
                <p class="item-title">{{ item.total_quantity }} ta</p>
                <p class="item-meta">{{ formatPrice(item.total_sales) }}</p>
              </div>
            </div>
          </div>
        </BaseCard>

        <BaseCard>
          <div class="card-head">
            <h3 class="section-title">Buyurtma turi bo‘yicha</h3>
          </div>

          <div v-if="salesByOrderType.length === 0" class="empty-text">
            Bu oraliqda ma’lumot topilmadi.
          </div>

          <div v-else class="list-block">
            <div v-for="item in salesByOrderType" :key="item.order_type" class="list-row">
              <div class="list-left">
                <p class="item-title">{{ orderTypeLabel(item.order_type) }}</p>
              </div>
              <div class="list-right">
                <p class="item-title">{{ item.orders_count }} ta</p>
                <p class="item-meta">{{ formatPrice(item.total_sales) }}</p>
              </div>
            </div>
          </div>
        </BaseCard>

        <BaseCard>
          <div class="card-head">
            <h3 class="section-title">Stollar bo‘yicha</h3>
            <span class="count-pill">{{ salesByTableState.total }}</span>
          </div>

          <div v-if="salesByTableState.items.length === 0" class="empty-text">
            Bu oraliqda ma’lumot topilmadi.
          </div>

          <div v-else class="list-block">
            <div
              v-for="item in salesByTableState.items"
              :key="item.table_id ?? 'unknown'"
              class="list-row"
            >
              <div class="list-left">
                <p class="item-title">
                  {{ item.table_number ? `Stol #${item.table_number}` : 'Stol o‘chirilgan' }}
                </p>
              </div>
              <div class="list-right">
                <p class="item-title">{{ item.completed_orders_count }} ta</p>
                <p class="item-meta">{{ formatPrice(item.total_sales) }}</p>
              </div>
            </div>
          </div>

          <div v-if="salesByTableState.totalPages > 1" class="pager">
            <button
              type="button"
              class="pager-btn"
              :disabled="salesByTableState.page <= 1 || sectionLoading.salesByTable"
              @click="loadSalesByTable(salesByTableState.page - 1)"
            >
              <ChevronLeft />
              <span>Oldingi</span>
            </button>
            <span class="pager-indicator">
              Sahifa {{ salesByTableState.page }} / {{ salesByTableState.totalPages }}
            </span>
            <button
              type="button"
              class="pager-btn"
              :disabled="salesByTableState.page >= salesByTableState.totalPages || sectionLoading.salesByTable"
              @click="loadSalesByTable(salesByTableState.page + 1)"
            >
              <span>Keyingi</span>
              <ChevronRight />
            </button>
          </div>
        </BaseCard>

        <BaseCard class="card-wide">
          <div class="card-head">
            <h3 class="section-title">So‘nggi tayyor buyurtmalar</h3>
            <span class="count-pill">{{ recentOrdersState.total }}</span>
          </div>

          <div v-if="recentOrdersState.items.length === 0" class="empty-text">
            Bu oraliqda ma’lumot topilmadi.
          </div>

          <div v-else class="list-block">
            <div
              v-for="item in recentOrdersState.items"
              :key="item.id"
              class="list-row"
            >
              <div class="list-left">
                <p class="item-title">Buyurtma #{{ item.id }}</p>
                <p class="item-meta">
                  {{ orderTypeLabel(item.order_type) }}
                  <template v-if="item.table_number">• Stol #{{ item.table_number }}</template>
                </p>
              </div>
              <div class="list-right">
                <p class="item-title">{{ formatPrice(item.total_price) }}</p>
                <p class="item-meta">{{ formatDate(item.closed_at) }}</p>
              </div>
            </div>
          </div>

          <div v-if="recentOrdersState.totalPages > 1" class="pager">
            <button
              type="button"
              class="pager-btn"
              :disabled="recentOrdersState.page <= 1 || sectionLoading.recentOrders"
              @click="loadRecentOrders(recentOrdersState.page - 1)"
            >
              <ChevronLeft />
              <span>Oldingi</span>
            </button>
            <span class="pager-indicator">
              Sahifa {{ recentOrdersState.page }} / {{ recentOrdersState.totalPages }}
            </span>
            <button
              type="button"
              class="pager-btn"
              :disabled="recentOrdersState.page >= recentOrdersState.totalPages || sectionLoading.recentOrders"
              @click="loadRecentOrders(recentOrdersState.page + 1)"
            >
              <span>Keyingi</span>
              <ChevronRight />
            </button>
          </div>
        </BaseCard>
      </div>
    </template>
  </BasePage>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { ChevronLeft, ChevronRight, FileDown, RefreshCw } from 'lucide-vue-next';
import { api } from '../services/api';
import BaseButton from '../components/base/BaseButton.vue';
import BaseCard from '../components/base/BaseCard.vue';
import BaseInput from '../components/base/BaseInput.vue';
import BasePage from '../components/base/BasePage.vue';
import BaseSectionHeader from '../components/base/BaseSectionHeader.vue';

const PAGE_SIZE = 10;

const loading = ref(true);
const exporting = ref(false);
const errorMessage = ref('');

const summary = ref({
  total_sales: 0,
  completed_orders_count: 0,
  total_items_sold: 0,
});
const salesByType = ref([]);
const salesByOrderType = ref([]);

const topItemsState = reactive(createPageState());
const salesByTableState = reactive(createPageState());
const recentOrdersState = reactive(createPageState());

const sectionLoading = reactive({
  topItems: false,
  salesByTable: false,
  recentOrders: false,
});

const today = new Date();
const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

const filters = reactive({
  fromDate: toDateInput(startOfMonth),
  toDate: toDateInput(today),
});

function createPageState() {
  return {
    items: [],
    page: 1,
    pageSize: PAGE_SIZE,
    total: 0,
    totalPages: 0,
  };
}

function toDateInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

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
    case 'INVALID_PAGE':
      return 'Sahifa raqami noto‘g‘ri.';
    case 'INVALID_PAGE_SIZE':
      return 'Sahifa hajmi noto‘g‘ri.';
    case 'EXPORT_FAILED':
      return 'Excel faylni saqlab bo‘lmadi.';
    default:
      return 'Xatolik yuz berdi.';
  }
}

async function exportToExcel() {
  if (exporting.value) {
    return;
  }

  exporting.value = true;
  errorMessage.value = '';

  try {
    await api.analytics.exportExcel(basePayload());
  } catch (_error) {
    errorMessage.value = 'Excel faylni saqlab bo‘lmadi.';
  } finally {
    exporting.value = false;
  }
}

function formatPrice(price) {
  return `${Number(price || 0).toLocaleString('uz-UZ')} so‘m`;
}

function formatDate(value) {
  if (!value) {
    return '';
  }

  return new Date(value).toLocaleString('uz-UZ', {
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function typeLabel(type) {
  return type === 'FOOD' ? 'Taom' : 'Combo';
}

function orderTypeLabel(type) {
  return type === 'DINE_IN' ? 'Zalda' : 'Olib ketish';
}

function basePayload() {
  return {
    fromDate: filters.fromDate,
    toDate: filters.toDate,
  };
}

function applyPage(state, result) {
  state.items = result.items;
  state.total = result.total;
  state.page = result.page;
  state.pageSize = result.pageSize;
  state.totalPages = result.totalPages;
}

async function loadTopItems(page) {
  sectionLoading.topItems = true;
  errorMessage.value = '';

  try {
    const result = await api.analytics.getTopItems({
      ...basePayload(),
      page,
      pageSize: PAGE_SIZE,
    });
    applyPage(topItemsState, result);
  } catch (error) {
    errorMessage.value = mapErrorMessage(error);
  } finally {
    sectionLoading.topItems = false;
  }
}

async function loadSalesByTable(page) {
  sectionLoading.salesByTable = true;
  errorMessage.value = '';

  try {
    const result = await api.analytics.getSalesByTable({
      ...basePayload(),
      page,
      pageSize: PAGE_SIZE,
    });
    applyPage(salesByTableState, result);
  } catch (error) {
    errorMessage.value = mapErrorMessage(error);
  } finally {
    sectionLoading.salesByTable = false;
  }
}

async function loadRecentOrders(page) {
  sectionLoading.recentOrders = true;
  errorMessage.value = '';

  try {
    const result = await api.analytics.getRecent({
      ...basePayload(),
      page,
      pageSize: PAGE_SIZE,
    });
    applyPage(recentOrdersState, result);
  } catch (error) {
    errorMessage.value = mapErrorMessage(error);
  } finally {
    sectionLoading.recentOrders = false;
  }
}

async function refreshAll() {
  loading.value = true;
  errorMessage.value = '';

  const payload = basePayload();

  try {
    const [summaryData, salesByTypeData, salesByOrderTypeData] = await Promise.all([
      api.analytics.getSummary(payload),
      api.analytics.getSalesByType(payload),
      api.analytics.getSalesByOrderType(payload),
      loadTopItems(1),
      loadSalesByTable(1),
      loadRecentOrders(1),
    ]);

    summary.value = summaryData;
    salesByType.value = salesByTypeData;
    salesByOrderType.value = salesByOrderTypeData;
  } catch (error) {
    errorMessage.value = mapErrorMessage(error);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  refreshAll();
});
</script>

<style scoped>
.error-text {
  padding: var(--space-2) var(--space-3);
  border: 1px solid #fecaca;
  border-radius: var(--radius-1);
  background: #fef2f2;
  color: #b91c1c;
  font-size: var(--font-size-sm);
}

.state-text,
.empty-text {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.empty-text {
  padding: var(--space-3);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-1);
  background: var(--color-bg-surface-soft);
  text-align: center;
}

:deep(.card) {
  padding: var(--space-3);
}

.filters {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-3);
  align-items: end;
}

.filter-action {
  display: flex;
  gap: var(--space-2);
}

.filter-action :deep(.button) {
  flex: 1;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-3);
}

.summary-label {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  margin-bottom: 4px;
}

.summary-value {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--color-text);
}

.analytics-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
}

.card-wide {
  grid-column: 1 / -1;
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
}

.section-title {
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: var(--color-text);
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.count-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  border-radius: 999px;
  background: var(--color-secondary);
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
  font-weight: 700;
}

.list-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.list-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: 8px var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-1);
  background: var(--color-bg-surface-soft);
}

.list-left,
.list-right {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.list-right {
  text-align: right;
  align-items: flex-end;
}

.item-title {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-text);
}

.item-meta {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.pager {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  margin-top: var(--space-3);
  padding-top: var(--space-2);
  border-top: 1px solid var(--color-border);
}

.pager-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-height: 32px;
  padding: 0 var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-1);
  background: var(--color-bg-surface);
  color: var(--color-text);
  font-size: var(--font-size-sm);
  font-weight: 600;
  cursor: pointer;
}

.pager-btn:not(:disabled):hover {
  background: var(--color-secondary);
}

.pager-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pager-btn :deep(svg) {
  width: 14px;
  height: 14px;
}

.pager-indicator {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  font-weight: 600;
}

@media (max-width: 960px) {
  .filters,
  .summary-grid,
  .analytics-grid {
    grid-template-columns: 1fr;
  }

  .card-wide {
    grid-column: auto;
  }
}
</style>
