<template>
  <BasePage>
    <BaseSectionHeader
      title="Taomlar"
      description="Bu yerda taomlarni boshqarish mumkin."
    >
      <template #actions>
        <div class="header-actions">
          <label class="field">
            <span class="field-label">Menyu</span>
            <select v-model="selectedGroupId" class="select" @change="loadFoods">
              <option value="">Barcha menyular</option>
              <option
                v-for="group in foodGroups"
                :key="group.id"
                :value="String(group.id)"
              >
                {{ group.name }}
              </option>
            </select>
          </label>

          <BaseButton @click="openCreateModal">
            <template #icon>
              <Plus />
            </template>
            Yangi taom
          </BaseButton>
        </div>
      </template>
    </BaseSectionHeader>

    <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>

    <BaseCard v-if="loading">
      <p class="state-text">Yuklanmoqda...</p>
    </BaseCard>

    <BaseEmptyState
      v-else-if="foods.length === 0"
      message="Hozircha taomlar yo‘q."
    />

    <BaseGrid v-else>
      <BaseCard v-for="food in foods" :key="food.id">
        <div class="food-card">
          <div class="food-head">
            <div>
              <h3 class="food-name">{{ food.name }}</h3>
              <p class="food-group">{{ food.food_group_name }}</p>
            </div>
            <span
              :class="['status-badge', food.is_active === 1 ? 'status-badge--active' : 'status-badge--inactive']"
            >
              {{ food.is_active === 1 ? 'Faol' : 'Faol emas' }}
            </span>
          </div>

          <p class="food-price">{{ formatPrice(food.price) }}</p>

          <div class="food-actions">
            <BaseButton variant="secondary" @click="openEditModal(food)">
              <template #icon>
                <Pencil />
              </template>
              Tahrirlash
            </BaseButton>

            <BaseButton
              variant="ghost"
              :disabled="statusLoadingId === food.id"
              @click="toggleActive(food)"
            >
              <template #icon>
                <Power />
              </template>
              {{
                statusLoadingId === food.id
                  ? 'Saqlanmoqda...'
                  : food.is_active === 1
                    ? 'Faol emas qilish'
                    : 'Faollashtirish'
              }}
            </BaseButton>

            <BaseButton variant="danger" @click="openDeleteModal(food)">
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
      :title="activeModal === 'create' ? 'Yangi taom' : 'Taomni tahrirlash'"
      @close="closeModal"
    >
      <div class="modal-form">
        <BaseInput
          v-model="form.name"
          label="Taom nomi"
          placeholder="Masalan: Osh"
        />

        <BaseInput
          v-model="form.price"
          label="Narxi"
          type="number"
          placeholder="Masalan: 25000"
        />

        <label class="field">
          <span class="field-label">Menyu</span>
          <select v-model="form.foodGroupId" class="select">
            <option value="">Menyuni tanlang</option>
            <option
              v-for="group in foodGroups"
              :key="group.id"
              :value="String(group.id)"
            >
              {{ group.name }}
            </option>
          </select>
        </label>
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
      title="Taomni o‘chirish"
      @close="closeModal"
    >
      <p class="modal-text">Haqiqatan ham bu taomni o‘chirmoqchimisiz?</p>

      <template #footer>
        <BaseButton variant="ghost" @click="closeModal">
          <template #icon>
            <X />
          </template>
          Bekor qilish
        </BaseButton>
        <BaseButton variant="danger" :disabled="submitting" @click="deleteFood">
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
import { onMounted, reactive, ref } from 'vue';
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

const foods = ref([]);
const foodGroups = ref([]);
const loading = ref(true);
const submitting = ref(false);
const statusLoadingId = ref(null);
const errorMessage = ref('');
const activeModal = ref('');
const selectedGroupId = ref('');
const selectedFood = ref(null);

const form = reactive({
  name: '',
  price: '',
  foodGroupId: '',
});

function mapErrorMessage(error) {
  switch (error?.message) {
    case 'INVALID_NAME':
      return 'Taom nomi noto‘g‘ri.';
    case 'INVALID_PRICE':
      return 'Narx noto‘g‘ri.';
    case 'INVALID_FOOD_GROUP_ID':
      return 'Menyu noto‘g‘ri tanlangan.';
    case 'FOOD_NOT_FOUND':
      return 'Taom topilmadi.';
    case 'FOOD_DELETE_FAILED':
      return 'Bu taomni o‘chirib bo‘lmaydi.';
    default:
      return 'Xatolik yuz berdi.';
  }
}

function formatPrice(price) {
  return `${Number(price || 0).toLocaleString('uz-UZ')} so‘m`;
}

function resetForm() {
  form.name = '';
  form.price = '';
  form.foodGroupId = '';
}

function closeModal() {
  activeModal.value = '';
  selectedFood.value = null;
  resetForm();
}

async function loadFoodGroups() {
  foodGroups.value = await api.foodGroup.getAll();
}

async function loadFoods() {
  const data = selectedGroupId.value
    ? await api.food.getByFoodGroupId(Number(selectedGroupId.value))
    : await api.food.getAll();

  foods.value = data;
}

async function loadPageData() {
  loading.value = true;
  errorMessage.value = '';

  try {
    await loadFoodGroups();
    await loadFoods();
  } catch (error) {
    errorMessage.value = mapErrorMessage(error);
  } finally {
    loading.value = false;
  }
}

function openCreateModal() {
  errorMessage.value = '';
  resetForm();
  selectedFood.value = null;
  activeModal.value = 'create';
}

function openEditModal(food) {
  errorMessage.value = '';
  selectedFood.value = food;
  form.name = food.name;
  form.price = String(food.price);
  form.foodGroupId = String(food.food_group_id);
  activeModal.value = 'edit';
}

function openDeleteModal(food) {
  errorMessage.value = '';
  selectedFood.value = food;
  activeModal.value = 'delete';
}

async function submitForm() {
  errorMessage.value = '';
  submitting.value = true;

  const payload = {
    name: form.name.trim(),
    price: Number(form.price),
    foodGroupId: Number(form.foodGroupId),
  };

  try {
    if (activeModal.value === 'create') {
      await api.food.create(payload);
    } else if (selectedFood.value) {
      await api.food.update(selectedFood.value.id, payload);
    }

    closeModal();
    await loadFoods();
  } catch (error) {
    errorMessage.value = mapErrorMessage(error);
  } finally {
    submitting.value = false;
  }
}

async function deleteFood() {
  if (!selectedFood.value) {
    return;
  }

  errorMessage.value = '';
  submitting.value = true;

  try {
    await api.food.delete(selectedFood.value.id);
    closeModal();
    await loadFoods();
  } catch (error) {
    errorMessage.value = mapErrorMessage(error);
  } finally {
    submitting.value = false;
  }
}

async function toggleActive(food) {
  errorMessage.value = '';
  statusLoadingId.value = food.id;

  try {
    await api.food.setActive(food.id, food.is_active !== 1);
    await loadFoods();
  } catch (error) {
    errorMessage.value = mapErrorMessage(error);
  } finally {
    statusLoadingId.value = null;
  }
}

onMounted(() => {
  loadPageData();
});
</script>

<style scoped>
.header-actions {
  display: flex;
  align-items: end;
  gap: var(--space-3);
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
  min-width: 180px;
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

.error-text {
  padding: var(--space-3);
  border: 1px solid #fecaca;
  border-radius: var(--radius-1);
  background: #fef2f2;
  color: #b91c1c;
}

.state-text,
.modal-text {
  color: var(--color-text-muted);
}

.food-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  min-height: 180px;
}

.food-head {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: var(--space-2);
}

.food-name {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--color-text);
}

.food-group {
  margin-top: 2px;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.food-price {
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

.food-actions {
  display: grid;
  gap: var(--space-2);
  margin-top: auto;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

@media (max-width: 720px) {
  .header-actions {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
  }

  .select {
    min-width: 0;
    width: 100%;
  }
}
</style>
