<template>
  <BasePage>
    <div class="page-head">
      <h1 class="page-title">Buyurtmalar</h1>
      <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
    </div>

    <div class="page-layout">
      <div class="left-column">
        <BaseCard>
          <div class="source-row">
            <div class="mode-switch">
              <button
                type="button"
                :class="['mode-btn', activeMode === 'DINE_IN' ? 'mode-btn--active' : '']"
                @click="activeMode = 'DINE_IN'"
              >
                Zalda
              </button>
              <button
                type="button"
                :class="['mode-btn', activeMode === 'TAKEAWAY' ? 'mode-btn--active' : '']"
                @click="activeMode = 'TAKEAWAY'"
              >
                Olib ketish
              </button>
            </div>

            <BaseButton
              v-if="activeMode === 'TAKEAWAY'"
              :disabled="actionLoading"
              @click="createTakeawayOrder"
            >
              <template #icon>
                <Plus />
              </template>
              Yangi olib ketish buyurtmasi
            </BaseButton>
          </div>

          <div v-if="loading" class="state-text">Yuklanmoqda...</div>

          <div v-else-if="activeMode === 'DINE_IN'" class="table-grid">
            <button
              v-for="table in tables"
              :key="table.id"
              type="button"
              :class="[
                'table-tile',
                selectedTableId === table.id ? 'table-tile--selected' : '',
                openDineInMap[table.id] ? 'table-tile--busy' : '',
              ]"
              @click="selectTable(table.id)"
            >
              <span class="table-tile__title">Stol #{{ table.number }}</span>
              <span v-if="openDineInMap[table.id]" class="table-tile__dot" />
            </button>
          </div>
        </BaseCard>

        <BaseCard>
          <div class="section-header">
            <h3 class="section-title">Ochiq zal buyurtmalari</h3>
            <span class="count-pill">{{ openDineInOrders.length }}</span>
          </div>

          <BaseEmptyState
            v-if="!loading && openDineInOrders.length === 0"
            message="Hozircha ochiq zal buyurtmalari yo‘q."
          />

          <div v-else class="board-list">
            <button
              v-for="order in openDineInOrders"
              :key="order.id"
              type="button"
              :class="[
                'board-row',
                activeOrder && activeOrder.id === order.id ? 'board-row--active' : '',
              ]"
              @click="openExistingOrder(order.id, order.table_id)"
            >
              <span class="board-row__id">#{{ order.id }}</span>
              <span class="board-row__mid">Stol #{{ order.table_number }}</span>
              <strong class="board-row__price">{{ formatPrice(order.total_price) }}</strong>
            </button>
          </div>
        </BaseCard>

        <BaseCard>
          <div class="section-header">
            <h3 class="section-title">Ochiq olib ketish buyurtmalari</h3>
            <span class="count-pill">{{ openTakeawayOrders.length }}</span>
          </div>

          <BaseEmptyState
            v-if="!loading && openTakeawayOrders.length === 0"
            message="Hozircha ochiq olib ketish buyurtmalari yo‘q."
          />

          <div v-else class="board-list">
            <button
              v-for="order in openTakeawayOrders"
              :key="order.id"
              type="button"
              :class="[
                'board-row',
                activeOrder && activeOrder.id === order.id ? 'board-row--active' : '',
              ]"
              @click="openExistingOrder(order.id)"
            >
              <span class="board-row__id">#{{ order.id }}</span>
              <span class="board-row__mid">Olib ketish</span>
              <strong class="board-row__price">{{ formatPrice(order.total_price) }}</strong>
            </button>
          </div>
        </BaseCard>

        <BaseCard>
          <div class="section-header">
            <h3 class="section-title">Tayyor buyurtmalar</h3>
            <div class="header-tools">
              <span class="count-pill">{{ displayedReadyOrders.length }}</span>
              <button
                type="button"
                class="link-btn"
                :disabled="clearedReadyOrderIds.length === 0"
                @click="restoreClearedReadyOrders"
              >
                Tozalanganlarni ko‘rsatish
              </button>
              <button
                type="button"
                class="link-btn"
                :disabled="displayedReadyOrders.length === 0"
                @click="clearAllReadyOrders"
              >
                Barchasini tozalash
              </button>
            </div>
          </div>

          <BaseEmptyState
            v-if="!loading && displayedReadyOrders.length === 0"
            message="Hozircha tayyor buyurtmalar yo‘q."
          />

          <div v-else class="board-list">
            <div
              v-for="order in displayedReadyOrders"
              :key="order.id"
              class="board-row board-row--ready"
            >
              <span class="board-row__id">#{{ order.id }}</span>
              <span class="board-row__mid">
                {{ order.order_type === 'DINE_IN' ? 'Zalda' : 'Olib ketish' }}
                <template v-if="order.table_number">• Stol #{{ order.table_number }}</template>
              </span>
              <strong class="board-row__price">{{ formatPrice(order.total_price) }}</strong>
              <button
                type="button"
                class="icon-btn"
                :disabled="printingOrderId === order.id"
                aria-label="Chek chiqarish"
                title="Chek chiqarish"
                @click="printReceipt(order.id)"
              >
                <Printer />
              </button>
              <button
                type="button"
                class="icon-btn"
                aria-label="Tozalash"
                @click="clearReadyOrder(order.id)"
              >
                <X />
              </button>
            </div>
          </div>
        </BaseCard>
      </div>

      <div class="right-column">
        <BaseCard v-if="workspaceLoading" class="workspace-empty">
          <p class="state-text">Yuklanmoqda...</p>
        </BaseCard>

        <BaseCard v-else-if="!activeOrder" class="workspace-empty">
          <p class="state-text">Buyurtma tanlanmagan.</p>
        </BaseCard>

        <BaseCard v-else class="workspace">
          <div class="workspace-head">
            <div class="workspace-head__left">
              <h3 class="workspace-title">Buyurtma #{{ activeOrder.id }}</h3>
              <span class="workspace-sub">
                {{ activeOrder.order_type === 'DINE_IN' ? 'Zalda' : 'Olib ketish' }}
                <template v-if="activeOrder.table_number">• Stol #{{ activeOrder.table_number }}</template>
              </span>
            </div>
            <div class="workspace-head__right">
              <span :class="['status-chip', `status-chip--${activeOrder.status.toLowerCase()}`]">
                {{ orderStatusText(activeOrder.status) }}
              </span>
              <strong class="workspace-total">{{ formatPrice(activeOrder.total_price) }}</strong>
            </div>
          </div>

          <div class="catalog">
            <div class="tab-row">
              <button
                type="button"
                :class="['tab-btn', catalogTab === 'foods' ? 'tab-btn--active' : '']"
                @click="catalogTab = 'foods'"
              >
                Taomlar
              </button>
              <button
                type="button"
                :class="['tab-btn', catalogTab === 'combos' ? 'tab-btn--active' : '']"
                @click="catalogTab = 'combos'"
              >
                Combo
              </button>
            </div>

            <div v-if="catalogTab === 'foods'" class="catalog-grid">
              <button
                v-for="food in activeFoods"
                :key="food.id"
                type="button"
                class="catalog-tile"
                :disabled="!isOrderOpen || actionLoading"
                @click="addFood(food.id)"
              >
                <span class="catalog-tile__title">{{ food.name }}</span>
                <span class="catalog-tile__price">{{ formatPrice(food.price) }}</span>
              </button>
            </div>

            <div v-else class="catalog-grid">
              <button
                v-for="combo in activeCombos"
                :key="combo.id"
                type="button"
                class="catalog-tile"
                :disabled="!isOrderOpen || actionLoading"
                @click="addCombo(combo.id)"
              >
                <span class="catalog-tile__title">{{ combo.name }}</span>
                <span class="catalog-tile__price">{{ formatPrice(combo.price) }}</span>
              </button>
            </div>
          </div>

          <div class="items-block">
            <div class="section-header">
              <h3 class="section-title">Buyurtma tarkibi</h3>
            </div>

            <BaseEmptyState
              v-if="activeOrder.items.length === 0"
              message="Hozircha taomlar qo‘shilmagan."
            />

            <div v-else class="items-list">
              <div
                v-for="item in activeOrder.items"
                :key="item.id"
                class="item-row"
              >
                <div class="item-info">
                  <span class="item-name">{{ item.item_name }}</span>
                  <span class="item-meta">
                    {{ formatPrice(item.unit_price) }} × {{ item.quantity }}
                  </span>
                </div>

                <div class="item-actions">
                  <button
                    type="button"
                    class="step-btn"
                    :disabled="!isOrderOpen || actionLoading || item.quantity <= 1"
                    @click="changeQuantity(item, item.quantity - 1)"
                  >
                    <Minus />
                  </button>
                  <span class="quantity-badge">{{ item.quantity }}</span>
                  <button
                    type="button"
                    class="step-btn"
                    :disabled="!isOrderOpen || actionLoading"
                    @click="changeQuantity(item, item.quantity + 1)"
                  >
                    <Plus />
                  </button>
                  <button
                    type="button"
                    class="step-btn step-btn--danger"
                    :disabled="!isOrderOpen || actionLoading"
                    aria-label="Olib tashlash"
                    @click="removeItem(item.id)"
                  >
                    <Trash2 />
                  </button>
                </div>

                <strong class="item-total">{{ formatPrice(item.total_price) }}</strong>
              </div>
            </div>
          </div>

          <div class="final-actions">
            <BaseButton
              variant="danger"
              :disabled="!isOrderOpen || actionLoading"
              @click="cancelOrder"
            >
              <template #icon>
                <Ban />
              </template>
              Bekor qilish
            </BaseButton>
            <BaseButton
              class="ready-btn"
              :disabled="!isOrderOpen || actionLoading || activeOrder.items.length === 0"
              @click="markReady"
            >
              <template #icon>
                <Check />
              </template>
              Tayyor
            </BaseButton>
          </div>
        </BaseCard>
      </div>
    </div>
  </BasePage>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { Ban, Check, Minus, Plus, Printer, Trash2, X } from 'lucide-vue-next';
import { api } from '../services/api';
import BaseButton from '../components/base/BaseButton.vue';
import BaseCard from '../components/base/BaseCard.vue';
import BaseEmptyState from '../components/base/BaseEmptyState.vue';
import BasePage from '../components/base/BasePage.vue';

const orderApi = window.api.order;

const loading = ref(true);
const workspaceLoading = ref(false);
const actionLoading = ref(false);
const errorMessage = ref('');
const activeMode = ref('DINE_IN');
const selectedTableId = ref(null);
const activeOrder = ref(null);
const tables = ref([]);
const foods = ref([]);
const combos = ref([]);
const openDineInOrders = ref([]);
const openTakeawayOrders = ref([]);
const readyOrders = ref([]);
const clearedReadyOrderIds = ref(loadClearedReadyIds());
const catalogTab = ref('foods');
const printingOrderId = ref(null);

const CLEARED_READY_STORAGE_KEY = 'orders.clearedReadyIds';

function loadClearedReadyIds() {
  try {
    const raw = window.localStorage.getItem('orders.clearedReadyIds');
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.map((value) => Number(value)).filter((value) => Number.isInteger(value));
  } catch (_error) {
    return [];
  }
}

function persistClearedReadyIds(ids) {
  try {
    window.localStorage.setItem(CLEARED_READY_STORAGE_KEY, JSON.stringify(ids));
  } catch (_error) {
    // ignore storage errors (quota, disabled, etc.)
  }
}

const activeFoods = computed(() => foods.value.filter((item) => item.is_active === 1));
const activeCombos = computed(() => combos.value.filter((item) => item.is_active === 1));
const isOrderOpen = computed(() => activeOrder.value?.status === 'OPEN');
const openDineInMap = computed(() =>
  Object.fromEntries(openDineInOrders.value.map((order) => [order.table_id, order]))
);
const displayedReadyOrders = computed(() =>
  readyOrders.value.filter((order) => !clearedReadyOrderIds.value.includes(order.id))
);

function mapErrorMessage(error) {
  switch (error?.message) {
    case 'ORDER_NOT_FOUND':
      return 'Buyurtma topilmadi.';
    case 'ORDER_NOT_OPEN':
      return 'Bu buyurtmani o‘zgartirib bo‘lmaydi.';
    case 'ORDER_ITEM_NOT_FOUND':
      return 'Buyurtma elementi topilmadi.';
    case 'ORDER_EMPTY':
      return 'Bo‘sh buyurtmani tayyor deb belgilab bo‘lmaydi.';
    case 'TABLE_NOT_FOUND':
      return 'Stol topilmadi.';
    case 'FOOD_NOT_FOUND':
      return 'Taom topilmadi.';
    case 'FOOD_INACTIVE':
      return 'Faol bo‘lmagan taomni qo‘shib bo‘lmaydi.';
    case 'COMBO_NOT_FOUND':
      return 'Combo topilmadi.';
    case 'COMBO_INACTIVE':
      return 'Faol bo‘lmagan comboni qo‘shib bo‘lmaydi.';
    case 'INVALID_QUANTITY':
      return 'Soni noto‘g‘ri.';
    case 'ORDER_NOT_READY':
      return 'Buyurtma hali tayyor emas.';
    case 'RECEIPT_BINARY_NOT_FOUND':
      return 'Chek dasturi topilmadi.';
    case 'RECEIPT_PRINT_FAILED':
      return 'Chekni chiqarib bo‘lmadi.';
    default:
      return 'Xatolik yuz berdi.';
  }
}

async function printReceipt(orderId) {
  if (printingOrderId.value !== null) {
    return;
  }

  printingOrderId.value = orderId;
  errorMessage.value = '';

  try {
    await api.order.printReceipt(orderId);
  } catch (error) {
    errorMessage.value = mapErrorMessage(error);
  } finally {
    printingOrderId.value = null;
  }
}

function formatPrice(price) {
  return `${Number(price || 0).toLocaleString('uz-UZ')} so‘m`;
}

function orderStatusText(status) {
  if (status === 'READY') {
    return 'Tayyor';
  }

  if (status === 'CANCELLED') {
    return 'Bekor qilingan';
  }

  return 'Ochiq';
}

function clearReadyOrder(orderId) {
  if (!clearedReadyOrderIds.value.includes(orderId)) {
    clearedReadyOrderIds.value = [...clearedReadyOrderIds.value, orderId];
    persistClearedReadyIds(clearedReadyOrderIds.value);
  }
}

function clearAllReadyOrders() {
  const merged = new Set(clearedReadyOrderIds.value);
  for (const order of readyOrders.value) {
    merged.add(order.id);
  }
  clearedReadyOrderIds.value = Array.from(merged);
  persistClearedReadyIds(clearedReadyOrderIds.value);
}

function restoreClearedReadyOrders() {
  clearedReadyOrderIds.value = [];
  persistClearedReadyIds(clearedReadyOrderIds.value);
}

async function loadResources() {
  const [tableList, foodList, comboList] = await Promise.all([
    api.table.getAll(),
    api.food.getAll(),
    api.combo.getAll(),
  ]);

  tables.value = tableList;
  foods.value = foodList;
  combos.value = comboList;
}

async function loadBoards() {
  const [dineIn, takeaway, ready] = await Promise.all([
    orderApi.listOpenDineInOrders(),
    orderApi.listOpenTakeawayOrders(),
    orderApi.listReadyOrders(20),
  ]);

  openDineInOrders.value = dineIn;
  openTakeawayOrders.value = takeaway;
  readyOrders.value = ready;
}

async function loadInitialData() {
  loading.value = true;
  errorMessage.value = '';

  try {
    await Promise.all([loadResources(), loadBoards()]);
  } catch (error) {
    errorMessage.value = mapErrorMessage(error);
  } finally {
    loading.value = false;
  }
}

async function reloadActiveOrder() {
  if (!activeOrder.value) {
    return;
  }

  activeOrder.value = await api.order.getById(activeOrder.value.id);
}

async function refreshAfterMutation() {
  await Promise.all([reloadActiveOrder(), loadBoards()]);
}

async function selectTable(tableId) {
  workspaceLoading.value = true;
  errorMessage.value = '';
  activeMode.value = 'DINE_IN';
  selectedTableId.value = tableId;

  try {
    activeOrder.value = await api.order.getOrCreateDineInByTableId(tableId);
    await loadBoards();
  } catch (error) {
    errorMessage.value = mapErrorMessage(error);
  } finally {
    workspaceLoading.value = false;
  }
}

async function createTakeawayOrder() {
  actionLoading.value = true;
  errorMessage.value = '';
  activeMode.value = 'TAKEAWAY';
  selectedTableId.value = null;

  try {
    activeOrder.value = await api.order.createTakeawayOrder();
    await loadBoards();
  } catch (error) {
    errorMessage.value = mapErrorMessage(error);
  } finally {
    actionLoading.value = false;
  }
}

async function openExistingOrder(orderId, tableId = null) {
  workspaceLoading.value = true;
  errorMessage.value = '';
  selectedTableId.value = tableId;
  activeMode.value = tableId ? 'DINE_IN' : 'TAKEAWAY';

  try {
    activeOrder.value = await api.order.getById(orderId);
  } catch (error) {
    errorMessage.value = mapErrorMessage(error);
  } finally {
    workspaceLoading.value = false;
  }
}

async function addFood(foodId) {
  if (!activeOrder.value) {
    return;
  }

  actionLoading.value = true;
  errorMessage.value = '';

  try {
    await api.order.addFoodItemToOrder(activeOrder.value.id, {
      foodId,
      quantity: 1,
    });
    await refreshAfterMutation();
  } catch (error) {
    errorMessage.value = mapErrorMessage(error);
  } finally {
    actionLoading.value = false;
  }
}

async function addCombo(comboId) {
  if (!activeOrder.value) {
    return;
  }

  actionLoading.value = true;
  errorMessage.value = '';

  try {
    await api.order.addComboItemToOrder(activeOrder.value.id, {
      comboId,
      quantity: 1,
    });
    await refreshAfterMutation();
  } catch (error) {
    errorMessage.value = mapErrorMessage(error);
  } finally {
    actionLoading.value = false;
  }
}

async function changeQuantity(item, quantity) {
  if (!activeOrder.value || quantity < 1) {
    return;
  }

  actionLoading.value = true;
  errorMessage.value = '';

  try {
    await api.order.updateItemQuantity(activeOrder.value.id, item.id, quantity);
    await refreshAfterMutation();
  } catch (error) {
    errorMessage.value = mapErrorMessage(error);
  } finally {
    actionLoading.value = false;
  }
}

async function removeItem(itemId) {
  if (!activeOrder.value) {
    return;
  }

  actionLoading.value = true;
  errorMessage.value = '';

  try {
    await api.order.removeItem(activeOrder.value.id, itemId);
    await refreshAfterMutation();
  } catch (error) {
    errorMessage.value = mapErrorMessage(error);
  } finally {
    actionLoading.value = false;
  }
}

async function markReady() {
  if (!activeOrder.value) {
    return;
  }

  actionLoading.value = true;
  errorMessage.value = '';

  try {
    const readyOrderId = activeOrder.value.id;

    await orderApi.markReady(readyOrderId);
    activeOrder.value = null;
    selectedTableId.value = null;
    await loadBoards();

    if (clearedReadyOrderIds.value.includes(readyOrderId)) {
      clearedReadyOrderIds.value = clearedReadyOrderIds.value.filter((id) => id !== readyOrderId);
      persistClearedReadyIds(clearedReadyOrderIds.value);
    }
  } catch (error) {
    errorMessage.value = mapErrorMessage(error);
  } finally {
    actionLoading.value = false;
  }
}

async function cancelOrder() {
  if (!activeOrder.value) {
    return;
  }

  actionLoading.value = true;
  errorMessage.value = '';

  try {
    await api.order.cancel(activeOrder.value.id);
    activeOrder.value = null;
    selectedTableId.value = null;
    await loadBoards();
  } catch (error) {
    errorMessage.value = mapErrorMessage(error);
  } finally {
    actionLoading.value = false;
  }
}

onMounted(() => {
  loadInitialData();
});
</script>

<style scoped>
.page-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.page-title {
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--color-text);
}

.error-text {
  padding: var(--space-2) var(--space-3);
  border: 1px solid #fecaca;
  border-radius: var(--radius-1);
  background: #fef2f2;
  color: #b91c1c;
  font-size: var(--font-size-sm);
}

.page-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr);
  gap: var(--space-3);
  align-items: start;
}

.left-column,
.right-column {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  min-width: 0;
}

.right-column {
  position: sticky;
  top: var(--space-3);
}

:deep(.card) {
  padding: var(--space-3);
}

.source-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
}

.mode-switch {
  display: inline-flex;
  padding: 2px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-1);
  background: var(--color-bg-surface-soft);
}

.mode-btn {
  min-height: 36px;
  padding: 0 var(--space-3);
  border: 0;
  border-radius: var(--radius-1);
  background: transparent;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  font-weight: 600;
  cursor: pointer;
}

.mode-btn--active {
  background: var(--color-bg-surface);
  color: var(--color-text);
  box-shadow: var(--shadow-soft);
}

.section-header {
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

.header-tools {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
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

.link-btn {
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--color-primary);
  font-size: var(--font-size-sm);
  font-weight: 600;
  cursor: pointer;
}

.link-btn:disabled {
  color: var(--color-text-soft);
  cursor: not-allowed;
  opacity: 0.6;
}

.state-text {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.table-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(76px, 1fr));
  gap: var(--space-2);
}

.table-tile {
  position: relative;
  min-height: 56px;
  padding: 6px 8px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-1);
  background: var(--color-bg-surface-soft);
  color: var(--color-text);
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.table-tile:hover {
  border-color: var(--color-border-strong);
}

.table-tile--busy {
  background: #eefbf3;
  border-color: #bbf7d0;
}

.table-tile--selected {
  border-color: var(--color-primary);
  background: #eff6ff;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
}

.table-tile__title {
  font-size: var(--font-size-sm);
}

.table-tile__dot {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #16a34a;
}

.board-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.board-row {
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  align-items: center;
  gap: var(--space-2);
  min-height: 42px;
  padding: 6px var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-1);
  background: var(--color-bg-surface-soft);
  color: var(--color-text);
  text-align: left;
  font: inherit;
  cursor: pointer;
}

.board-row:hover {
  border-color: var(--color-border-strong);
}

.board-row--active {
  border-color: var(--color-primary);
  background: #eff6ff;
}

.board-row--ready {
  border-color: #bbf7d0;
  background: #f0fdf4;
  cursor: default;
}

.board-row__id {
  font-weight: 700;
  color: var(--color-text);
  font-size: var(--font-size-sm);
}

.board-row__mid {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.board-row__price {
  font-size: var(--font-size-sm);
  color: var(--color-text);
  font-weight: 700;
}

.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: var(--radius-1);
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
}

.icon-btn:hover {
  background: var(--color-secondary);
  color: var(--color-text);
}

.icon-btn :deep(svg) {
  width: 16px;
  height: 16px;
}

.workspace-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 220px;
}

.workspace {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.workspace-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--color-border);
}

.workspace-head__left {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.workspace-head__right {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
}

.workspace-title {
  font-size: var(--font-size-md);
  font-weight: 700;
  color: var(--color-text);
}

.workspace-sub {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.status-chip {
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: var(--font-size-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.status-chip--open {
  background: #eff6ff;
  color: var(--color-primary);
}

.status-chip--ready {
  background: #f0fdf4;
  color: #166534;
}

.status-chip--cancelled {
  background: #fef2f2;
  color: var(--color-danger);
}

.workspace-total {
  font-size: var(--font-size-md);
  color: var(--color-text);
}

.catalog {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.tab-row {
  display: inline-flex;
  border-bottom: 1px solid var(--color-border);
}

.tab-btn {
  padding: 6px var(--space-3);
  border: 0;
  background: transparent;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  font-weight: 600;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
}

.tab-btn--active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
}

.catalog-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: var(--space-2);
  max-height: 220px;
  overflow-y: auto;
}

.catalog-tile {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: var(--space-1);
  min-height: 64px;
  padding: var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-1);
  background: var(--color-bg-surface-soft);
  text-align: left;
  cursor: pointer;
}

.catalog-tile:not(:disabled):hover {
  border-color: var(--color-primary);
  background: #eff6ff;
}

.catalog-tile:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.catalog-tile__title {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-text);
  line-height: 1.3;
}

.catalog-tile__price {
  font-size: var(--font-size-xs);
  color: var(--color-primary);
  font-weight: 700;
}

.items-block {
  display: flex;
  flex-direction: column;
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 280px;
  overflow-y: auto;
}

.item-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  align-items: center;
  gap: var(--space-2);
  padding: 6px var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-1);
  background: var(--color-bg-surface-soft);
}

.item-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.item-name {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-meta {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.item-actions {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
}

.step-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-1);
  background: var(--color-bg-surface);
  color: var(--color-text);
  cursor: pointer;
}

.step-btn:not(:disabled):hover {
  background: var(--color-secondary);
}

.step-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.step-btn--danger {
  color: var(--color-danger);
  border-color: #fecaca;
}

.step-btn--danger:not(:disabled):hover {
  background: #fef2f2;
}

.step-btn :deep(svg) {
  width: 14px;
  height: 14px;
}

.quantity-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: var(--color-text);
}

.item-total {
  font-size: var(--font-size-sm);
  color: var(--color-text);
  font-weight: 700;
  white-space: nowrap;
}

.final-actions {
  display: grid;
  grid-template-columns: 1fr 1.4fr;
  gap: var(--space-2);
  padding-top: var(--space-3);
  border-top: 1px solid var(--color-border);
}

.final-actions :deep(.button) {
  width: 100%;
  min-height: 48px;
  font-size: var(--font-size-md);
}

.ready-btn {
  background: #16a34a;
  border-color: #16a34a;
}

.ready-btn:not(:disabled):hover {
  background: #15803d;
  border-color: #15803d;
}

@media (max-width: 1180px) {
  .page-layout {
    grid-template-columns: 1fr;
  }

  .right-column {
    position: static;
  }
}

@media (max-width: 720px) {
  .source-row,
  .workspace-head {
    flex-direction: column;
    align-items: stretch;
  }

  .item-row {
    grid-template-columns: 1fr;
  }

  .item-actions {
    justify-content: space-between;
  }
}
</style>
