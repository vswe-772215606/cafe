<template>
  <BasePage>
    <BaseSectionHeader
      title="Menyu"
      description="Bu yerda menyu bo‘limlarini boshqarish mumkin."
    >
      <template #actions>
        <BaseButton @click="openCreateModal">Yangi bo‘lim</BaseButton>
      </template>
    </BaseSectionHeader>

    <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>

    <BaseCard v-if="loading">
      <p class="state-text">Yuklanmoqda...</p>
    </BaseCard>

    <BaseEmptyState
      v-else-if="groups.length === 0"
      message="Hozircha menyu bo‘limlari yo‘q."
    />

    <BaseGrid v-else>
      <BaseCard v-for="group in groups" :key="group.id">
        <div class="group-card">
          <div class="group-content">
            <h3 class="group-name">{{ group.name }}</h3>
          </div>
          <div class="group-actions">
            <BaseButton variant="secondary" @click="openEditModal(group)">
              Tahrirlash
            </BaseButton>
            <BaseButton variant="danger" @click="openDeleteModal(group)">
              O‘chirish
            </BaseButton>
          </div>
        </div>
      </BaseCard>
    </BaseGrid>

    <BaseModal
      v-if="activeModal === 'create'"
      title="Yangi bo‘lim qo‘shish"
      @close="closeModal"
    >
      <BaseInput
        v-model="createName"
        label="Bo‘lim nomi"
        placeholder="Masalan: Ichimliklar"
      />

      <template #footer>
        <BaseButton variant="ghost" @click="closeModal">Bekor qilish</BaseButton>
        <BaseButton :disabled="submitting" @click="createGroup">
          {{ submitting ? 'Saqlanmoqda...' : 'Saqlash' }}
        </BaseButton>
      </template>
    </BaseModal>

    <BaseModal
      v-if="activeModal === 'edit'"
      title="Bo‘limni tahrirlash"
      @close="closeModal"
    >
      <BaseInput
        v-model="editName"
        label="Bo‘lim nomi"
        placeholder="Masalan: Ichimliklar"
      />

      <template #footer>
        <BaseButton variant="ghost" @click="closeModal">Bekor qilish</BaseButton>
        <BaseButton :disabled="submitting" @click="saveEdit">
          {{ submitting ? 'Saqlanmoqda...' : 'Saqlash' }}
        </BaseButton>
      </template>
    </BaseModal>

    <BaseModal
      v-if="activeModal === 'delete'"
      title="Bo‘limni o‘chirish"
      @close="closeModal"
    >
      <p class="modal-text">Haqiqatan ham bu bo‘limni o‘chirmoqchimisiz?</p>

      <template #footer>
        <BaseButton variant="ghost" @click="closeModal">Bekor qilish</BaseButton>
        <BaseButton variant="danger" :disabled="submitting" @click="deleteGroup">
          {{ submitting ? 'O‘chirilmoqda...' : 'O‘chirish' }}
        </BaseButton>
      </template>
    </BaseModal>
  </BasePage>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { api } from '../services/api';
import BaseButton from '../components/base/BaseButton.vue';
import BaseCard from '../components/base/BaseCard.vue';
import BaseEmptyState from '../components/base/BaseEmptyState.vue';
import BaseGrid from '../components/base/BaseGrid.vue';
import BaseInput from '../components/base/BaseInput.vue';
import BaseModal from '../components/base/BaseModal.vue';
import BasePage from '../components/base/BasePage.vue';
import BaseSectionHeader from '../components/base/BaseSectionHeader.vue';

const groups = ref([]);
const loading = ref(true);
const submitting = ref(false);
const errorMessage = ref('');
const activeModal = ref('');
const createName = ref('');
const editName = ref('');
const selectedGroup = ref(null);

function mapErrorMessage(error) {
  switch (error?.message) {
    case 'INVALID_NAME':
      return 'Bo‘lim nomi noto‘g‘ri kiritildi.';
    case 'FOOD_GROUP_NOT_FOUND':
      return 'Menyu bo‘limi topilmadi.';
    case 'FOOD_GROUP_DELETE_FAILED':
      return 'Bu bo‘limni o‘chirib bo‘lmaydi. Avval unga bog‘langan taomlarni tekshiring.';
    default:
      return 'Xatolik yuz berdi.';
  }
}

async function loadGroups() {
  loading.value = true;

  try {
    groups.value = await api.foodGroup.getAll();
  } catch (error) {
    errorMessage.value = mapErrorMessage(error);
  } finally {
    loading.value = false;
  }
}

function closeModal() {
  activeModal.value = '';
  createName.value = '';
  editName.value = '';
  selectedGroup.value = null;
}

function openCreateModal() {
  errorMessage.value = '';
  createName.value = '';
  activeModal.value = 'create';
}

function openEditModal(group) {
  errorMessage.value = '';
  selectedGroup.value = group;
  editName.value = group.name;
  activeModal.value = 'edit';
}

function openDeleteModal(group) {
  errorMessage.value = '';
  selectedGroup.value = group;
  activeModal.value = 'delete';
}

async function createGroup() {
  errorMessage.value = '';
  submitting.value = true;

  try {
    await api.foodGroup.create({ name: createName.value.trim() });
    closeModal();
    await loadGroups();
  } catch (error) {
    errorMessage.value = mapErrorMessage(error);
  } finally {
    submitting.value = false;
  }
}

async function saveEdit() {
  if (!selectedGroup.value) {
    return;
  }

  errorMessage.value = '';
  submitting.value = true;

  try {
    await api.foodGroup.update(selectedGroup.value.id, { name: editName.value.trim() });
    closeModal();
    await loadGroups();
  } catch (error) {
    errorMessage.value = mapErrorMessage(error);
  } finally {
    submitting.value = false;
  }
}

async function deleteGroup() {
  if (!selectedGroup.value) {
    return;
  }

  errorMessage.value = '';
  submitting.value = true;

  try {
    await api.foodGroup.delete(selectedGroup.value.id);
    closeModal();
    await loadGroups();
  } catch (error) {
    errorMessage.value = mapErrorMessage(error);
  } finally {
    submitting.value = false;
  }
}

onMounted(() => {
  loadGroups();
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

.state-text,
.modal-text {
  color: var(--color-text-muted);
}

.group-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  min-height: 128px;
}

.group-content {
  flex: 1;
  display: flex;
  align-items: flex-start;
}

.group-name {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--color-text);
}

.group-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-2);
}

@media (max-width: 640px) {
  .group-actions {
    grid-template-columns: 1fr;
  }
}
</style>
