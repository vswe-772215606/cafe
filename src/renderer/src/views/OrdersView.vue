<template>
  <BasePage>
    <BaseSectionHeader
      title="Buyurtmalar"
      description="Bu yerda buyurtmalar bilan ishlash mumkin."
    />

    <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>

    <div class="mode-switch">
      <BaseButton
        :variant="activeMode === 'DINE_IN' ? 'primary' : 'secondary'"
        @click="switchMode('DINE_IN')"
      >
        Zalda
      </BaseButton>
      <BaseButton
        :variant="activeMode === 'TAKEAWAY' ? 'primary' : 'secondary'"
        @click="switchMode('TAKEAWAY')"
      >
        Olib ketish
      </BaseButton>
    </div>

    <div class="orders-layout">
      <div class="sidebar-stack">
        <BaseCard v-if="loading">
          <p class="state-text">Yuklanmoqda...</p>
        </BaseCard>

        <template v-else>
          <BaseCard v-if="activeMode === 'DINE_IN'">
            <div class="section-head">
              <h3 class="section-title">Zalda</h3>
              <span class="section-meta">{{ openDineInOrders.length }} ta ochiq</span>
            </div>

            <div class="table-grid">
              <button
                v-for="table in tables"
                :key="table.id"
                type="button"
                :class="[
                  'table-tile',
                  selectedTableId === table.id ? 'table-tile--selected' : '',
                  openDineInMap[table.id] ? 'table-tile--busy' : '',
                ]"
                @click="selectDineInTable(table)"
              >
                <span class="table-name">Stol #{{ table.number }}</span>
                <span class="table-note">
                  {{ openDineInMap[table.id] ? 'Ochiq buyurtma bor' : 'Bo‘sh' }}
                </span>
              </button>
            </div>

            <BaseEmptyState
              v-if="tables.length === 0"
              message="Hozircha stollar yo‘q."
            />
          </BaseCard>

          <BaseCard v-else>
            <div class="section-head">
              <h3 class="section-title">Olib ketish</h3>
              <BaseButton @click="createTakeawayOrder">
                <template #icon>
                  <Plus />
                </template>
                Yangi olib ketish buyurtmasi
              </BaseButton>
            </div>

            <div v-if="openTakeawayOrders.length === 0">
              <BaseEmptyState message="Hozircha ochiq olib ketish buyurtmalari yo‘q." />
            </div>

            <div v-else class="takeaway-list">
              <button
                v-for="order in openTakeawayOrders"
                :key="order.id"
                type="button"
                :class="[
                  'takeaway-tile',
                  selectedOrderId === order.id ? 'takeaway-tile--selected' : '',
                ]"
                @click="selectOrder(order.id)"
              >
                <span class="takeaway-title">Buyurtma #{{ order.id }}</span>
                <span class="takeaway-note">{{ formatPrice(order.total_price) }}</span>
              </button>
            </div>
          </BaseCard>

          <BaseCard v-if="activeMode === 'DINE_IN' && openDineInOrders.length === 0 && tables.length > 0">
            <BaseEmptyState message="Hozircha ochiq zal buyurtmalari yo‘q." />
          </BaseCard>
        </template>
      </div>

      <div class="workspace-stack">
        <BaseCard v-if="workspaceLoading">
          <p class="state-text">Yuklanmoqda...</p>
        </BaseCard>

        <BaseEmptyState
          v-else-if="!activeOrder"
          message="Buyurtma tanlanmagan."
        />

        <template v-else>
          <BaseCard>
            <div class="summary-head">
              <div>
                <h3 class="summary-title">Buyurtma #{{ activeOrder.id }}</h3>
                <p class="summary-text">
                  {{ activeOrder.order_type === 'DINE_IN' ? 'Zalda' : 'Olib ketish' }}
                  <span v-if="activeOrder.table_number">• Stol #{{ activeOrder.table_number }}</span>
                </p>
              </div>

              <div class="summary-badges">
                <span :class="['status-badge', statusClass(activeOrder.status)]">
                  {{ orderStatusLabel(activeOrder.status) }}
                </span>
                <span class="total-badge">{{ formatPrice(activeOrder.total_price) }}</span>
              </div>
            </div>

            <div class="summary-actions">
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

          <div class="workspace-grid">
            <BaseCard>
              <div class="section-head">
                <h3 class="section-title">Taom qo‘shish</h3>
              </div>

              <div v-if="activeFoods.length === 0">
                <BaseEmptyState message="Hozircha taomlar yo‘q." />
              </div>

              <div v-else class="product-list">
                <div v-for="food in activeFoods" :key="food.id" class="product-row">
                  <div>
                    <p class="product-name">{{ food.name }}</p>
                    <p class="product-meta">{{ formatPrice(food.price) }}</p>
                  </div>

                  <div class="inline-actions">
                    <input
                      v-model="foodQuantities[food.id]"
                      class="qty-input"
                      type="number"
                      min="1"
                      :disabled="!isOrderOpen || actionLoading"
                    />
                    <BaseButton
                      :disabled="!isOrderOpen || actionLoading"
                      @click="addFood(food)"
                    >
                      <template #icon>
                        <Plus />
                      </template>
                      Qo‘shish
                    </BaseButton>
                  </div>
                </div>
              </div>
            </BaseCard>

            <BaseCard>
              <div class="section-head">
                <h3 class="section-title">Combo qo‘shish</h3>
              </div>

              <div v-if="activeCombos.length === 0">
                <BaseEmptyState message="Hozircha combo yo‘q." />
              </div>

              <div v-else class="product-list">
                <div v-for="combo in activeCombos" :key="combo.id" class="product-row">
                  <div>
                    <p class="product-name">{{ combo.name }}</p>
                    <p class="product-meta">{{ formatPrice(combo.price) }}</p>
                  </div>

                  <div class="inline-actions">
                    <input
                      v-model="comboQuantities[combo.id]"
                      class="qty-input"
                      type="number"
                      min="1"
                      :disabled="!isOrderOpen || actionLoading"
                    />
                    <BaseButton
                      :disabled="!isOrderOpen || actionLoading"
                      @click="addCombo(combo)"
                    >
                      <template #icon>
                        <Plus />
                      </template>
                      Qo‘shish
                    </BaseButton>
                  </div>
                </div>
              </div>
            </BaseCard>
          </div>

          <BaseCard>
            <div class="section-head">
              <h3 class="section-title">Buyurtma tarkibi</h3>
            </div>

            <BaseEmptyState
              v-if="activeOrder.items.length === 0"
              message="Buyurtmada mahsulot yo‘q."
            />

            <div v-else class="order-items">
              <div
                v-for="item in activeOrder.items"
                :key="item.id"
                class="order-item"
              >
                <div>
                  <p class="product-name">{{ item.item_name }}</p>
                  <p class="product-meta">
                    {{ item.type === 'FOOD' ? 'Taom' : 'Combo' }} •
                    {{ formatPrice(item.unit_price) }}
                  </p>
                </div>

                <div class="inline-actions">
                  <input
                    :value="String(item.quantity)"
                    class="qty-input"
                    type="number"
                    min="1"
                    :disabled="!isOrderOpen || actionLoading"
                    @change="changeItemQuantity(item, $event)"
                  />
                  <span class="item-total">{{ formatPrice(item.total_price) }}</span>
                  <BaseButton
                    variant="danger"
                    :disabled="!isOrderOpen || actionLoading"
                    @click="removeItem(item)"
                  >
                    <template #icon>
                      <Trash2 />
                    </template>
                    Olib tashlash
                  </BaseButton>
                </div>
              </div>
            </div>
          </BaseCard>
        </template>
      </div>
    </div>
  </BasePage>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { Ban, Check, Plus, Trash2 } from 'lucide-vue-next';
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
const tables = ref([]);
const foods = ref([]);
const combos = ref([]);
const openDineInOrders = ref([]);
const openTakeawayOrders = ref([]);
const activeOrder = ref(null);
const selectedOrderId = ref(null);
const selectedTableId = ref(null);
const foodQuantities = ref({});
const comboQuantities = ref({});

const openDineInMap = computed(() =>
  Object.fromEntries(openDineInOrders.value.map((order) => [order.table_id, order]))
);

const activeFoods = computed(() => foods.value.filter((food) => food.is_active === 1));
const activeCombos = computed(() => combos.value.filter((combo) => combo.is_active === 1));
const isOrderOpen = computed(() => activeOrder.value?.status === 'OPEN');

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

function orderStatusLabel(status) {
  if (status === 'READY') {
    return 'Tayyor';
  }

  if (status === 'CANCELLED') {
    return 'Bekor qilingan';
  }

  return 'Ochiq';
}

function statusClass(status) {
  if (status === 'READY') {
    return 'status-badge--ready';
  }

  if (status === 'CANCELLED') {
    return 'status-badge--cancelled';
  }

  return 'status-badge--open';
}

function switchMode(mode) {
  activeMode.value = mode;
  errorMessage.value = '';
  activeOrder.value = null;
  selectedOrderId.value = null;

  if (mode === 'TAKEAWAY') {
    selectedTableId.value = null;
  }
}

async function loadStaticData() {
  const [tableList, foodList, comboList] = await Promise.all([
    api.table.getAll(),
    api.food.getAll(),
    api.combo.getAll(),
  ]);

  tables.value = tableList;
  foods.value = foodList;
  combos.value = comboList;

  foodQuantities.value = Object.fromEntries(foodList.map((food) => [food.id, '1']));
  comboQuantities.value = Object.fromEntries(comboList.map((combo) => [combo.id, '1']));
}

async function loadOpenOrders() {
  const [dineInList, takeawayList] = await Promise.all([
    orderApi.listOpenDineInOrders(),
    orderApi.listOpenTakeawayOrders(),
  ]);

  openDineInOrders.value = dineInList;
  openTakeawayOrders.value = takeawayList;
}

async function refreshLists() {
  await Promise.all([loadStaticData(), loadOpenOrders()]);
}

async function selectOrder(orderId) {
  workspaceLoading.value = true;
  errorMessage.value = '';

  try {
    const order = await api.order.getById(orderId);
    activeOrder.value = order;
    selectedOrderId.value = order.id;
    selectedTableId.value = order.table_id || null;
  } catch (error) {
    errorMessage.value = mapErrorMessage(error);
    activeOrder.value = null;
    selectedOrderId.value = null;
  } finally {
    workspaceLoading.value = false;
  }
}

async function selectDineInTable(table) {
  workspaceLoading.value = true;
  errorMessage.value = '';

  try {
    const order = await api.order.getOrCreateDineInByTableId(table.id);
    selectedTableId.value = table.id;
    activeOrder.value = order;
    selectedOrderId.value = order.id;
    await loadOpenOrders();
  } catch (error) {
    errorMessage.value = mapErrorMessage(error);
  } finally {
    workspaceLoading.value = false;
  }
}

async function createTakeawayOrder() {
  actionLoading.value = true;
  errorMessage.value = '';

  try {
    const order = await api.order.createTakeawayOrder();
    activeMode.value = 'TAKEAWAY';
    activeOrder.value = order;
    selectedOrderId.value = order.id;
    selectedTableId.value = null;
    await loadOpenOrders();
  } catch (error) {
    errorMessage.value = mapErrorMessage(error);
  } finally {
    actionLoading.value = false;
  }
}

async function reloadActiveOrder() {
  if (!selectedOrderId.value) {
    return;
  }

  await selectOrder(selectedOrderId.value);
}

async function addFood(food) {
  if (!selectedOrderId.value) {
    return;
  }

  actionLoading.value = true;
  errorMessage.value = '';

  try {
    const quantity = Number(foodQuantities.value[food.id] || 1);
    activeOrder.value = await orderApi.addFoodItemToOrder(selectedOrderId.value, {
      foodId: food.id,
      quantity,
    });
    await loadOpenOrders();
  } catch (error) {
    errorMessage.value = mapErrorMessage(error);
  } finally {
    actionLoading.value = false;
  }
}

async function addCombo(combo) {
  if (!selectedOrderId.value) {
    return;
  }

  actionLoading.value = true;
  errorMessage.value = '';

  try {
    const quantity = Number(comboQuantities.value[combo.id] || 1);
    activeOrder.value = await orderApi.addComboItemToOrder(selectedOrderId.value, {
      comboId: combo.id,
      quantity,
    });
    await loadOpenOrders();
  } catch (error) {
    errorMessage.value = mapErrorMessage(error);
  } finally {
    actionLoading.value = false;
  }
}

async function changeItemQuantity(item, event) {
  if (!selectedOrderId.value) {
    return;
  }

  actionLoading.value = true;
  errorMessage.value = '';

  try {
    const quantity = Number(event.target.value);
    activeOrder.value = await orderApi.updateItemQuantity(selectedOrderId.value, item.id, quantity);
    await loadOpenOrders();
  } catch (error) {
    errorMessage.value = mapErrorMessage(error);
    event.target.value = String(item.quantity);
  } finally {
    actionLoading.value = false;
  }
}

async function removeItem(item) {
  if (!selectedOrderId.value) {
    return;
  }

  actionLoading.value = true;
  errorMessage.value = '';

  try {
    activeOrder.value = await orderApi.removeItem(selectedOrderId.value, item.id);
    await loadOpenOrders();
  } catch (error) {
    errorMessage.value = mapErrorMessage(error);
  } finally {
    actionLoading.value = false;
  }
}

async function markReady() {
  if (!selectedOrderId.value) {
    return;
  }

  actionLoading.value = true;
  errorMessage.value = '';

  try {
    activeOrder.value = await orderApi.markReady(selectedOrderId.value);
    await loadOpenOrders();
  } catch (error) {
    errorMessage.value = mapErrorMessage(error);
  } finally {
    actionLoading.value = false;
  }
}

async function cancelOrder() {
  if (!selectedOrderId.value) {
    return;
  }

  actionLoading.value = true;
  errorMessage.value = '';

  try {
    activeOrder.value = await orderApi.cancel(selectedOrderId.value);
    await loadOpenOrders();
  } catch (error) {
    errorMessage.value = mapErrorMessage(error);
  } finally {
    actionLoading.value = false;
  }
}

onMounted(async () => {
  loading.value = true;
  errorMessage.value = '';

  try {
    await refreshLists();
  } catch (error) {
    errorMessage.value = mapErrorMessage(error);
  } finally {
    loading.value = false;
  }
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

.mode-switch {
  display: flex;
  gap: var(--space-2);
}

.orders-layout {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  gap: var(--space-3);
}

.sidebar-stack,
.workspace-stack {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.workspace-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
}

.section-title {
  font-size: var(--font-size-md);
  font-weight: 700;
  color: var(--color-text);
}

.section-meta {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.table-grid,
.takeaway-list,
.product-list,
.order-items {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.table-tile,
.takeaway-tile {
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: start;
  width: 100%;
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-1);
  background: var(--color-bg-surface-soft);
  color: var(--color-text);
  text-align: left;
}

.table-tile--selected,
.takeaway-tile--selected {
  border-color: var(--color-primary);
  background: #eff6ff;
}

.table-tile--busy {
  background: #f8fafc;
}

.table-name,
.takeaway-title,
.product-name {
  font-weight: 700;
  color: var(--color-text);
}

.table-note,
.takeaway-note,
.product-meta,
.summary-text {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.summary-head {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: var(--space-3);
}

.summary-title {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--color-text);
}

.summary-badges {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.summary-actions {
  display: flex;
  gap: var(--space-2);
  margin-top: var(--space-3);
}

.status-badge,
.total-badge {
  padding: 4px 8px;
  border-radius: var(--radius-1);
  font-size: var(--font-size-xs);
  font-weight: 700;
}

.status-badge--open {
  background: #dbeafe;
  color: #1d4ed8;
}

.status-badge--ready {
  background: #dcfce7;
  color: #166534;
}

.status-badge--cancelled {
  background: #fee2e2;
  color: #b91c1c;
}

.total-badge {
  background: #f3f4f6;
  color: var(--color-text);
}

.product-row,
.order-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--space-3);
  align-items: center;
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-1);
  background: var(--color-bg-surface-soft);
}

.inline-actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.qty-input {
  width: 72px;
  min-height: 42px;
  padding: 0 var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-1);
  background: var(--color-bg-surface);
  color: var(--color-text);
}

.item-total {
  min-width: 96px;
  text-align: right;
  font-weight: 700;
  color: var(--color-text);
}

@media (max-width: 1100px) {
  .orders-layout,
  .workspace-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .summary-head,
  .section-head,
  .summary-actions,
  .product-row,
  .order-item,
  .inline-actions {
    grid-template-columns: 1fr;
    flex-direction: column;
    align-items: stretch;
  }

  .summary-badges {
    flex-wrap: wrap;
  }

  .item-total {
    min-width: 0;
    text-align: left;
  }
}
</style>
