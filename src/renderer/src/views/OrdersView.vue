<template>
  <BasePage>
    <BaseSectionHeader title="Buyurtmalar" />

    <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>

    <div class="page-layout">
      <div class="left-column">
        <BaseCard>
          <div class="top-controls">
            <div class="mode-actions">
              <BaseButton
                :variant="activeMode === 'DINE_IN' ? 'primary' : 'secondary'"
                @click="activeMode = 'DINE_IN'"
              >
                Zalda
              </BaseButton>
              <BaseButton
                :variant="activeMode === 'TAKEAWAY' ? 'primary' : 'secondary'"
                @click="activeMode = 'TAKEAWAY'"
              >
                Olib ketish
              </BaseButton>
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
            </button>
          </div>
        </BaseCard>

        <BaseCard>
          <div class="section-header">
            <h3 class="section-title">Ochiq zal buyurtmalari</h3>
          </div>

          <BaseEmptyState
            v-if="!loading && openDineInOrders.length === 0"
            message="Hozircha ochiq zal buyurtmalari yo‘q."
          />

          <div v-else class="board-grid">
            <div
              v-for="order in openDineInOrders"
              :key="order.id"
              class="board-card"
            >
              <div class="board-info">
                <p class="board-title">#{{ order.id }}</p>
                <p class="board-text">Stol #{{ order.table_number }}</p>
              </div>
              <div class="board-footer">
                <strong>{{ formatPrice(order.total_price) }}</strong>
                <BaseButton variant="secondary" @click="openExistingOrder(order.id, order.table_id)">
                  Ochish
                </BaseButton>
              </div>
            </div>
          </div>
        </BaseCard>

        <BaseCard>
          <div class="section-header">
            <h3 class="section-title">Ochiq olib ketish buyurtmalari</h3>
          </div>

          <BaseEmptyState
            v-if="!loading && openTakeawayOrders.length === 0"
            message="Hozircha ochiq olib ketish buyurtmalari yo‘q."
          />

          <div v-else class="board-grid">
            <div
              v-for="order in openTakeawayOrders"
              :key="order.id"
              class="board-card"
            >
              <div class="board-info">
                <p class="board-title">#{{ order.id }}</p>
                <p class="board-text">Olib ketish</p>
              </div>
              <div class="board-footer">
                <strong>{{ formatPrice(order.total_price) }}</strong>
                <BaseButton variant="secondary" @click="openExistingOrder(order.id)">
                  Ochish
                </BaseButton>
              </div>
            </div>
          </div>
        </BaseCard>

        <BaseCard>
          <div class="section-header">
            <h3 class="section-title">Tayyor buyurtmalar</h3>
            <BaseButton
              variant="ghost"
              :disabled="displayedReadyOrders.length === 0"
              @click="clearAllReadyOrders"
            >
              Barchasini tozalash
            </BaseButton>
          </div>

          <BaseEmptyState
            v-if="!loading && displayedReadyOrders.length === 0"
            message="Hozircha tayyor buyurtmalar yo‘q."
          />

          <div v-else class="ready-grid">
            <div
              v-for="order in displayedReadyOrders"
              :key="order.id"
              class="board-card board-card--ready"
            >
              <div class="board-info">
                <p class="board-title">#{{ order.id }}</p>
                <p class="board-text">
                  {{ order.order_type === 'DINE_IN' ? 'Zalda' : 'Olib ketish' }}
                  <span v-if="order.table_number">• Stol #{{ order.table_number }}</span>
                </p>
                <p class="board-text">{{ formatTime(order.closed_at) }}</p>
              </div>

              <div class="board-footer">
                <strong>{{ formatPrice(order.total_price) }}</strong>
                <BaseButton variant="ghost" @click="clearReadyOrder(order.id)">
                  Tozalash
                </BaseButton>
              </div>
            </div>
          </div>
        </BaseCard>
      </div>

      <div class="right-column">
        <BaseCard v-if="workspaceLoading">
          <p class="state-text">Yuklanmoqda...</p>
        </BaseCard>

        <BaseEmptyState
          v-else-if="!activeOrder"
          message="Buyurtma tanlanmagan."
        />

        <template v-else>
          <BaseCard>
            <div class="order-summary">
              <div>
                <h3 class="section-title">Buyurtma #{{ activeOrder.id }}</h3>
                <p class="summary-line">
                  {{ activeOrder.order_type === 'DINE_IN' ? 'Zalda' : 'Olib ketish' }}
                  <span v-if="activeOrder.table_number">• Stol #{{ activeOrder.table_number }}</span>
                </p>
              </div>

              <div class="summary-meta">
                <div class="summary-pill">
                  <span class="summary-label">Holati</span>
                  <strong>{{ orderStatusText(activeOrder.status) }}</strong>
                </div>
                <div class="summary-pill">
                  <span class="summary-label">Jami</span>
                  <strong>{{ formatPrice(activeOrder.total_price) }}</strong>
                </div>
              </div>
            </div>
          </BaseCard>

          <div class="workspace-grid">
            <BaseCard>
              <div class="section-header">
                <h3 class="section-title">Taomlar</h3>
              </div>

              <div v-if="activeFoods.length === 0" class="state-text">Yuklanmoqda...</div>

              <div v-else class="product-grid">
                <div v-for="food in activeFoods" :key="food.id" class="product-card">
                  <div>
                    <p class="product-title">{{ food.name }}</p>
                    <p class="product-price">{{ formatPrice(food.price) }}</p>
                  </div>
                  <BaseButton
                    :disabled="!isOrderOpen || actionLoading"
                    @click="addFood(food.id)"
                  >
                    <template #icon>
                      <Plus />
                    </template>
                    Qo‘shish
                  </BaseButton>
                </div>
              </div>
            </BaseCard>

            <BaseCard>
              <div class="section-header">
                <h3 class="section-title">Combo</h3>
              </div>

              <div v-if="activeCombos.length === 0" class="state-text">Yuklanmoqda...</div>

              <div v-else class="product-grid">
                <div v-for="combo in activeCombos" :key="combo.id" class="product-card">
                  <div>
                    <p class="product-title">{{ combo.name }}</p>
                    <p class="product-price">{{ formatPrice(combo.price) }}</p>
                  </div>
                  <BaseButton
                    :disabled="!isOrderOpen || actionLoading"
                    @click="addCombo(combo.id)"
                  >
                    <template #icon>
                      <Plus />
                    </template>
                    Qo‘shish
                  </BaseButton>
                </div>
              </div>
            </BaseCard>
          </div>

          <BaseCard>
            <div class="section-header">
              <h3 class="section-title">Buyurtma tarkibi</h3>
            </div>

            <div v-if="activeOrder.items.length === 0" class="state-text">
              Buyurtma tanlanmagan.
            </div>

            <div v-else class="items-list">
              <div
                v-for="item in activeOrder.items"
                :key="item.id"
                class="item-row"
              >
                <div class="item-info">
                  <p class="product-title">{{ item.item_name }}</p>
                  <p class="board-text">
                    {{ formatPrice(item.unit_price) }} • {{ formatPrice(item.total_price) }}
                  </p>
                </div>

                <div class="item-actions">
                  <BaseButton
                    variant="secondary"
                    :disabled="!isOrderOpen || actionLoading || item.quantity <= 1"
                    @click="changeQuantity(item, item.quantity - 1)"
                  >
                    <template #icon>
                      <Minus />
                    </template>
                  </BaseButton>

                  <span class="quantity-badge">{{ item.quantity }}</span>

                  <BaseButton
                    variant="secondary"
                    :disabled="!isOrderOpen || actionLoading"
                    @click="changeQuantity(item, item.quantity + 1)"
                  >
                    <template #icon>
                      <Plus />
                    </template>
                  </BaseButton>

                  <BaseButton
                    variant="danger"
                    :disabled="!isOrderOpen || actionLoading"
                    @click="removeItem(item.id)"
                  >
                    <template #icon>
                      <Trash2 />
                    </template>
                    Olib tashlash
                  </BaseButton>
                </div>
              </div>
            </div>

            <div class="final-actions">
              <BaseButton
                :disabled="!isOrderOpen || actionLoading"
                @click="markReady"
              >
                <template #icon>
                  <Check />
                </template>
                Tayyor
              </BaseButton>
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
            </div>
          </BaseCard>
        </template>
      </div>
    </div>
  </BasePage>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { Ban, Check, Minus, Plus, Trash2 } from 'lucide-vue-next';
import { api } from '../services/api';
import BaseButton from '../components/base/BaseButton.vue';
import BaseCard from '../components/base/BaseCard.vue';
import BaseEmptyState from '../components/base/BaseEmptyState.vue';
import BasePage from '../components/base/BasePage.vue';
import BaseSectionHeader from '../components/base/BaseSectionHeader.vue';

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
const clearedReadyOrderIds = ref([]);

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
    default:
      return 'Xatolik yuz berdi.';
  }
}

function formatPrice(price) {
  return `${Number(price || 0).toLocaleString('uz-UZ')} so‘m`;
}

function formatTime(value) {
  if (!value) {
    return '';
  }

  return new Date(value).toLocaleString('uz-UZ', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
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
  }
}

function clearAllReadyOrders() {
  clearedReadyOrderIds.value = readyOrders.value.map((order) => order.id);
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

    if (!clearedReadyOrderIds.value.includes(readyOrderId)) {
      clearedReadyOrderIds.value = clearedReadyOrderIds.value.filter((id) => id !== readyOrderId);
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
.page-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
  gap: var(--space-3);
}

.left-column,
.right-column {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.top-controls,
.section-header,
.order-summary,
.board-footer {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: var(--space-2);
}

.mode-actions,
.item-actions,
.final-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.section-title {
  font-size: var(--font-size-md);
  font-weight: 700;
  color: var(--color-text);
}

.error-text {
  padding: var(--space-3);
  border: 1px solid #fecaca;
  border-radius: var(--radius-1);
  background: #fef2f2;
  color: #b91c1c;
}

.state-text,
.board-text,
.summary-label,
.summary-line {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.table-grid,
.board-grid,
.ready-grid,
.product-grid,
.items-list,
.workspace-grid {
  display: grid;
  gap: var(--space-2);
}

.table-grid {
  grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
}

.board-grid,
.ready-grid {
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
}

.workspace-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.table-tile {
  min-height: 58px;
  padding: 8px 10px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-1);
  background: var(--color-bg-surface-soft);
  color: var(--color-text);
  text-align: left;
}

.table-tile--selected {
  border-color: var(--color-primary);
  background: #eff6ff;
}

.table-tile--busy {
  background: #eefbf3;
}

.table-tile__title,
.board-title,
.product-title {
  color: var(--color-text);
  font-weight: 700;
}

.board-card,
.product-card,
.item-row,
.summary-pill {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-1);
  background: var(--color-bg-surface-soft);
}

.board-card--ready {
  border-color: #bbf7d0;
  background: #f0fdf4;
}

.board-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.product-grid {
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
}

.product-price,
.quantity-badge {
  color: var(--color-primary);
  font-weight: 700;
}

.summary-boxes,
.final-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.item-row {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.item-info {
  min-width: 0;
}

.quantity-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 36px;
}

@media (max-width: 1180px) {
  .page-layout,
  .workspace-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .top-controls,
  .section-header,
  .order-summary,
  .board-footer,
  .item-row {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
