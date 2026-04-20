<template>
  <BasePage>
    <BaseSectionHeader
      title="Stollar"
      description="Bu yerda stollarni boshqarish mumkin."
    >
      <template #actions>
        <BaseButton @click="openCreateModal">
          <template #icon>
            <Plus />
          </template>
          Yangi stol
        </BaseButton>
      </template>
    </BaseSectionHeader>

    <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>

    <BaseCard v-if="loading">
      <p class="state-text">Yuklanmoqda...</p>
    </BaseCard>

    <BaseEmptyState
      v-else-if="tables.length === 0"
      message="Hozircha stollar yo‘q."
    />

    <BaseGrid v-else>
      <BaseCard v-for="table in tables" :key="table.id">
        <div class="table-card">
          <div>
            <h3 class="table-title">Stol #{{ table.number }}</h3>
          </div>

          <div class="table-actions">
            <BaseButton variant="secondary" @click="openEditModal(table)">
              <template #icon>
                <Pencil />
              </template>
              Tahrirlash
            </BaseButton>

            <BaseButton variant="danger" @click="openDeleteModal(table)">
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
      :title="activeModal === 'create' ? 'Yangi stol' : 'Stolni tahrirlash'"
      @close="closeModal"
    >
      <BaseInput
        v-model="tableNumber"
        label="Stol raqami"
        type="number"
        placeholder="Masalan: 12"
      />

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
      title="Stolni o‘chirish"
      @close="closeModal"
    >
      <p class="state-text">Haqiqatan ham bu stolni o‘chirmoqchimisiz?</p>

      <template #footer>
        <BaseButton variant="ghost" @click="closeModal">
          <template #icon>
            <X />
          </template>
          Bekor qilish
        </BaseButton>
        <BaseButton variant="danger" :disabled="submitting" @click="deleteTable">
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
import { onMounted, ref } from 'vue';
import { Check, Pencil, Plus, Trash2, X } from 'lucide-vue-next';
import { api } from '../services/api';
import BaseButton from '../components/base/BaseButton.vue';
import BaseCard from '../components/base/BaseCard.vue';
import BaseEmptyState from '../components/base/BaseEmptyState.vue';
import BaseGrid from '../components/base/BaseGrid.vue';
import BaseInput from '../components/base/BaseInput.vue';
import BaseModal from '../components/base/BaseModal.vue';
import BasePage from '../components/base/BasePage.vue';
import BaseSectionHeader from '../components/base/BaseSectionHeader.vue';

const tables = ref([]);
const loading = ref(true);
const submitting = ref(false);
const errorMessage = ref('');
const activeModal = ref('');
const selectedTable = ref(null);
const tableNumber = ref('');

function mapErrorMessage(error) {
  switch (error?.message) {
    case 'INVALID_TABLE_NUMBER':
      return 'Stol raqami noto‘g‘ri.';
    case 'TABLE_NOT_FOUND':
      return 'Stol topilmadi.';
    case 'TABLE_NUMBER_EXISTS':
      return 'Bunday stol raqami allaqachon mavjud.';
    case 'TABLE_DELETE_FAILED':
      return 'Bu stolni o‘chirib bo‘lmaydi.';
    default:
      return 'Xatolik yuz berdi.';
  }
}

async function loadTables() {
  loading.value = true;
  errorMessage.value = '';

  try {
    tables.value = await api.table.getAll();
  } catch (error) {
    errorMessage.value = mapErrorMessage(error);
  } finally {
    loading.value = false;
  }
}

function closeModal() {
  activeModal.value = '';
  selectedTable.value = null;
  tableNumber.value = '';
}

function openCreateModal() {
  errorMessage.value = '';
  tableNumber.value = '';
  selectedTable.value = null;
  activeModal.value = 'create';
}

function openEditModal(table) {
  errorMessage.value = '';
  selectedTable.value = table;
  tableNumber.value = String(table.number);
  activeModal.value = 'edit';
}

function openDeleteModal(table) {
  errorMessage.value = '';
  selectedTable.value = table;
  activeModal.value = 'delete';
}

async function submitForm() {
  errorMessage.value = '';
  submitting.value = true;

  try {
    if (activeModal.value === 'create') {
      await api.table.create({ number: Number(tableNumber.value) });
    } else if (selectedTable.value) {
      await api.table.update(selectedTable.value.id, { number: Number(tableNumber.value) });
    }

    closeModal();
    await loadTables();
  } catch (error) {
    errorMessage.value = mapErrorMessage(error);
  } finally {
    submitting.value = false;
  }
}

async function deleteTable() {
  if (!selectedTable.value) {
    return;
  }

  errorMessage.value = '';
  submitting.value = true;

  try {
    await api.table.delete(selectedTable.value.id);
    closeModal();
    await loadTables();
  } catch (error) {
    errorMessage.value = mapErrorMessage(error);
  } finally {
    submitting.value = false;
  }
}

onMounted(() => {
  loadTables();
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

.table-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  min-height: 150px;
}

.table-title {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--color-text);
}

.table-actions {
  display: grid;
  gap: var(--space-2);
  margin-top: auto;
}
</style>
