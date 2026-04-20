<template>
  <BasePage>
    <BaseSectionHeader
      title="Combo"
      description="Bu yerda combo to‘plamlarni boshqarish mumkin."
    >
      <template #actions>
        <BaseButton @click="openCreateModal">
          <template #icon>
            <Plus />
          </template>
          Yangi combo
        </BaseButton>
      </template>
    </BaseSectionHeader>

    <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>

    <BaseCard v-if="loading">
      <p class="state-text">Yuklanmoqda...</p>
    </BaseCard>

    <BaseEmptyState
      v-else-if="combos.length === 0"
      message="Hozircha combo yo‘q."
    />

    <BaseGrid v-else>
      <BaseCard v-for="combo in combos" :key="combo.id">
        <div class="combo-card">
          <div class="combo-head">
            <div>
              <h3 class="combo-name">{{ combo.name }}</h3>
              <p class="combo-price">{{ formatPrice(combo.price) }}</p>
            </div>
            <span
              :class="['status-badge', combo.is_active === 1 ? 'status-badge--active' : 'status-badge--inactive']"
            >
              {{ combo.is_active === 1 ? 'Faol' : 'Faol emas' }}
            </span>
          </div>

          <div class="combo-actions">
            <BaseButton variant="secondary" @click="openEditModal(combo)">
              <template #icon>
                <Pencil />
              </template>
              Tahrirlash
            </BaseButton>

            <BaseButton
              variant="ghost"
              :disabled="statusLoadingId === combo.id"
              @click="toggleActive(combo)"
            >
              <template #icon>
                <Power />
              </template>
              {{
                statusLoadingId === combo.id
                  ? 'Saqlanmoqda...'
                  : combo.is_active === 1
                    ? 'Faol emas qilish'
                    : 'Faollashtirish'
              }}
            </BaseButton>

            <BaseButton variant="danger" @click="openDeleteModal(combo)">
              <template #icon>
                <Trash2 />
              </template>
              O‘chirish
            </BaseButton>
          </div>
        </div>
      </BaseCard>
    </BaseGrid>

    <BaseModal
      v-if="activeModal === 'create' || activeModal === 'edit'"
      :title="activeModal === 'create' ? 'Yangi combo' : 'Comboni tahrirlash'"
      @close="closeModal"
    >
      <div class="modal-form">
        <BaseInput
          v-model="form.name"
          label="Combo nomi"
          placeholder="Masalan: Nonushta"
        />

        <BaseInput
          v-model="form.price"
          label="Narxi"
          type="number"
          placeholder="Masalan: 45000"
        />

        <label class="field">
          <span class="field-label">Holati</span>
          <select v-model="form.isActive" class="select">
            <option value="true">Faol</option>
            <option value="false">Faol emas</option>
          </select>
        </label>

        <div class="items-block">
          <div class="items-header">
            <div>
              <p class="field-label">Tarkibi</p>
            </div>
            <BaseButton variant="secondary" @click="addItemRow">
              <template #icon>
                <Plus />
              </template>
              Tarkib qo‘shish
            </BaseButton>
          </div>

          <div v-if="form.items.length === 0" class="state-text">
            Hozircha tarkib kiritilmagan.
          </div>

          <div
            v-for="(item, index) in form.items"
            :key="item.key"
            class="item-row"
          >
            <label class="field item-field">
              <span class="field-label">Taom</span>
              <select v-model="item.foodId" class="select">
                <option value="">Taomni tanlang</option>
                <option
                  v-for="food in activeFoods"
                  :key="food.id"
                  :value="String(food.id)"
                >
                  {{ food.name }}
                </option>
              </select>
            </label>

            <BaseInput
              v-model="item.quantity"
              label="Soni"
              type="number"
              placeholder="1"
            />

            <BaseButton variant="danger" @click="removeItemRow(index)">
              <template #icon>
                <Trash2 />
              </template>
              Olib tashlash
            </BaseButton>
          </div>
        </div>
      </div>

      <template #footer>
        <BaseButton variant="ghost" @click="closeModal">
          <template #icon>
            <X />
          </template>
          Bekor qilish
        </BaseButton>
        <BaseButton :disabled="submitting" @click="submitForm">
          <template #icon>
            <Check />
          </template>
          {{ submitting ? 'Saqlanmoqda...' : 'Saqlash' }}
        </BaseButton>
      </template>
    </BaseModal>

    <BaseModal
      v-if="activeModal === 'delete'"
      title="Comboni o‘chirish"
      @close="closeModal"
    >
      <p class="state-text">Haqiqatan ham bu comboni o‘chirmoqchimisiz?</p>

      <template #footer>
        <BaseButton variant="ghost" @click="closeModal">
          <template #icon>
            <X />
          </template>
          Bekor qilish
        </BaseButton>
        <BaseButton variant="danger" :disabled="submitting" @click="deleteCombo">
          <template #icon>
            <Trash2 />
          </template>
          {{ submitting ? 'O‘chirilmoqda...' : 'O‘chirish' }}
        </BaseButton>
      </template>
    </BaseModal>
  </BasePage>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { Check, Pencil, Plus, Power, Trash2, X } from 'lucide-vue-next';
import { api } from '../services/api';
import BaseButton from '../components/base/BaseButton.vue';
import BaseCard from '../components/base/BaseCard.vue';
import BaseEmptyState from '../components/base/BaseEmptyState.vue';
import BaseGrid from '../components/base/BaseGrid.vue';
import BaseInput from '../components/base/BaseInput.vue';
import BaseModal from '../components/base/BaseModal.vue';
import BasePage from '../components/base/BasePage.vue';
import BaseSectionHeader from '../components/base/BaseSectionHeader.vue';

const combos = ref([]);
const foods = ref([]);
const loading = ref(true);
const submitting = ref(false);
const statusLoadingId = ref(null);
const errorMessage = ref('');
const activeModal = ref('');
const selectedCombo = ref(null);
const nextItemKey = ref(1);

const form = reactive({
  name: '',
  price: '',
  isActive: 'true',
  items: [],
});

const activeFoods = computed(() => foods.value.filter((food) => food.is_active === 1));

function mapErrorMessage(error) {
  switch (error?.message) {
    case 'INVALID_NAME':
      return 'Combo nomi noto‘g‘ri.';
    case 'INVALID_PRICE':
      return 'Narx noto‘g‘ri.';
    case 'INVALID_ITEMS':
      return 'Combo tarkibi noto‘g‘ri.';
    case 'INVALID_FOOD_ID':
      return 'Taom noto‘g‘ri tanlangan.';
    case 'INVALID_QUANTITY':
      return 'Soni noto‘g‘ri.';
    case 'COMBO_NOT_FOUND':
      return 'Combo topilmadi.';
    case 'COMBO_NAME_EXISTS':
      return 'Bunday combo nomi allaqachon mavjud.';
    case 'COMBO_DELETE_FAILED':
      return 'Bu comboni o‘chirib bo‘lmaydi.';
    case 'FOOD_NOT_FOUND':
      return 'Taom topilmadi.';
    case 'FOOD_INACTIVE':
      return 'Faol bo‘lmagan taomni combo tarkibiga qo‘shib bo‘lmaydi.';
    default:
      return 'Xatolik yuz berdi.';
  }
}

function formatPrice(price) {
  return `${Number(price || 0).toLocaleString('uz-UZ')} so‘m`;
}

function createEmptyItem() {
  const item = {
    key: nextItemKey.value,
    foodId: '',
    quantity: '1',
  };

  nextItemKey.value += 1;
  return item;
}

function resetForm() {
  form.name = '';
  form.price = '';
  form.isActive = 'true';
  form.items = [createEmptyItem()];
}

function closeModal() {
  activeModal.value = '';
  selectedCombo.value = null;
  resetForm();
}

function addItemRow() {
  form.items.push(createEmptyItem());
}

function removeItemRow(index) {
  form.items.splice(index, 1);
}

function buildPayload() {
  return {
    name: form.name.trim(),
    price: Number(form.price),
    isActive: form.isActive === 'true',
    items: form.items.map((item) => ({
      foodId: Number(item.foodId),
      quantity: Number(item.quantity),
    })),
  };
}

async function loadPageData() {
  loading.value = true;
  errorMessage.value = '';

  try {
    const [comboList, foodList] = await Promise.all([
      api.combo.getAll(),
      api.food.getAll(),
    ]);

    combos.value = comboList;
    foods.value = foodList;
  } catch (error) {
    errorMessage.value = mapErrorMessage(error);
  } finally {
    loading.value = false;
  }
}

function openCreateModal() {
  errorMessage.value = '';
  selectedCombo.value = null;
  resetForm();
  activeModal.value = 'create';
}

async function openEditModal(combo) {
  errorMessage.value = '';
  submitting.value = true;

  try {
    const data = await api.combo.getById(combo.id);

    selectedCombo.value = combo;
    form.name = data.name;
    form.price = String(data.price);
    form.isActive = data.is_active === 1 ? 'true' : 'false';
    form.items = data.items.map((item) => ({
      key: nextItemKey.value++,
      foodId: String(item.food_id),
      quantity: String(item.quantity),
    }));

    if (form.items.length === 0) {
      form.items = [createEmptyItem()];
    }

    activeModal.value = 'edit';
  } catch (error) {
    errorMessage.value = mapErrorMessage(error);
  } finally {
    submitting.value = false;
  }
}

function openDeleteModal(combo) {
  errorMessage.value = '';
  selectedCombo.value = combo;
  activeModal.value = 'delete';
}

async function submitForm() {
  errorMessage.value = '';
  submitting.value = true;

  try {
    const payload = buildPayload();

    if (activeModal.value === 'create') {
      await api.combo.create(payload);
    } else if (selectedCombo.value) {
      await api.combo.update(selectedCombo.value.id, payload);
    }

    closeModal();
    await loadPageData();
  } catch (error) {
    errorMessage.value = mapErrorMessage(error);
  } finally {
    submitting.value = false;
  }
}

async function toggleActive(combo) {
  errorMessage.value = '';
  statusLoadingId.value = combo.id;

  try {
    await api.combo.setActive(combo.id, combo.is_active !== 1);
    await loadPageData();
  } catch (error) {
    errorMessage.value = mapErrorMessage(error);
  } finally {
    statusLoadingId.value = null;
  }
}

async function deleteCombo() {
  if (!selectedCombo.value) {
    return;
  }

  errorMessage.value = '';
  submitting.value = true;

  try {
    await window.api.combo.delete(selectedCombo.value.id);
    closeModal();
    await loadPageData();
  } catch (error) {
    errorMessage.value = mapErrorMessage(error);
  } finally {
    submitting.value = false;
  }
}

onMounted(() => {
  resetForm();
  loadPageData();
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

.combo-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  min-height: 170px;
}

.combo-head {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: var(--space-2);
}

.combo-name {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--color-text);
}

.combo-price {
  margin-top: 2px;
  font-size: var(--font-size-md);
  font-weight: 700;
  color: var(--color-primary);
}

.status-badge {
  padding: 4px 8px;
  border-radius: var(--radius-1);
  font-size: var(--font-size-xs);
  font-weight: 700;
  white-space: nowrap;
}

.status-badge--active {
  background: #dcfce7;
  color: #166534;
}

.status-badge--inactive {
  background: #f3f4f6;
  color: #6b7280;
}

.combo-actions {
  display: grid;
  gap: var(--space-2);
  margin-top: auto;
}

.modal-form,
.items-block {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.items-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}

.item-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 110px auto;
  gap: var(--space-2);
  align-items: end;
}

.field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.field-label {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-text);
}

.select {
  min-height: 42px;
  padding: 0 var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-1);
  background: var(--color-bg-surface);
  color: var(--color-text);
}

.select:focus {
  outline: none;
  border-color: var(--color-primary);
}

@media (max-width: 720px) {
  .items-header {
    flex-direction: column;
    align-items: stretch;
  }

  .item-row {
    grid-template-columns: 1fr;
  }
}
</style>
