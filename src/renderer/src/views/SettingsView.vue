<template>
  <BasePage>
    <BaseSectionHeader title="Sozlamalar" />

    <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
    <p v-if="successMessage" class="success-text">{{ successMessage }}</p>

    <BaseCard>
      <div class="section">
        <div class="section-head">
          <h2 class="section-title">Printer sozlamalari</h2>
        </div>

        <div v-if="loading" class="state-text">Yuklanmoqda...</div>

        <div v-else-if="printers.length === 0" class="state-text">
          Printerlar topilmadi.
        </div>

        <div v-else class="field">
          <label class="field-label" for="receipt-printer">Chek printeri</label>
          <select
            id="receipt-printer"
            v-model="selectedPrinter"
            class="select"
          >
            <option value="" disabled>Printerni tanlang</option>
            <option
              v-for="printer in printers"
              :key="printer.name"
              :value="printer.name"
            >
              {{ printer.displayName }}{{ printer.isDefault ? ' (asosiy)' : '' }}
            </option>
          </select>
        </div>

        <div class="actions">
          <BaseButton
            :disabled="saving || !selectedPrinter"
            @click="savePrinter"
          >
            <template #icon>
              <Check />
            </template>
            {{ saving ? 'Saqlanmoqda...' : 'Saqlash' }}
          </BaseButton>

          <BaseButton
            variant="secondary"
            :disabled="testing || !selectedPrinter"
            @click="testPrinter"
          >
            <template #icon>
              <Printer />
            </template>
            {{ testing ? 'Yuborilmoqda...' : 'Test qilish' }}
          </BaseButton>

          <BaseButton
            variant="ghost"
            :disabled="loading"
            @click="reload"
          >
            <template #icon>
              <RefreshCw />
            </template>
            Yangilash
          </BaseButton>
        </div>
      </div>
    </BaseCard>
  </BasePage>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { Check, Printer, RefreshCw } from 'lucide-vue-next';
import { api } from '../services/api';
import BaseButton from '../components/base/BaseButton.vue';
import BaseCard from '../components/base/BaseCard.vue';
import BasePage from '../components/base/BasePage.vue';
import BaseSectionHeader from '../components/base/BaseSectionHeader.vue';

const printers = ref([]);
const selectedPrinter = ref('');
const loading = ref(true);
const saving = ref(false);
const testing = ref(false);
const errorMessage = ref('');
const successMessage = ref('');

function mapErrorMessage(error) {
  switch (error?.message) {
    case 'INVALID_PRINTER_NAME':
      return 'Printer topilmadi.';
    case 'PRINTER_NOT_FOUND':
      return 'Printer topilmadi.';
    case 'RECEIPT_BINARY_NOT_FOUND':
      return 'Chek dasturi topilmadi.';
    case 'RECEIPT_PRINT_FAILED':
      return 'Chekni chiqarib bo‘lmadi.';
    default:
      return 'Xatolik yuz berdi.';
  }
}

function clearMessages() {
  errorMessage.value = '';
  successMessage.value = '';
}

async function loadPrinters() {
  loading.value = true;
  clearMessages();

  try {
    const [printerList, settings] = await Promise.all([
      api.settings.listPrinters(),
      api.settings.getPrinterSettings(),
    ]);

    printers.value = printerList || [];

    const savedName = settings?.receiptPrinterName || '';
    const available = printers.value.find((p) => p.name === savedName);

    if (available) {
      selectedPrinter.value = savedName;
    } else if (savedName) {
      selectedPrinter.value = '';
      errorMessage.value = `Saqlangan printer (${savedName}) topilmadi.`;
    } else {
      const defaultPrinter = printers.value.find((p) => p.isDefault);
      selectedPrinter.value = defaultPrinter ? defaultPrinter.name : '';
    }
  } catch (error) {
    errorMessage.value = mapErrorMessage(error);
  } finally {
    loading.value = false;
  }
}

async function reload() {
  await loadPrinters();
}

async function savePrinter() {
  if (!selectedPrinter.value) {
    return;
  }

  clearMessages();
  saving.value = true;

  try {
    await api.settings.savePrinterSettings({
      receiptPrinterName: selectedPrinter.value,
    });
    successMessage.value = 'Sozlama saqlandi.';
  } catch (error) {
    errorMessage.value = mapErrorMessage(error);
  } finally {
    saving.value = false;
  }
}

async function testPrinter() {
  if (!selectedPrinter.value) {
    return;
  }

  clearMessages();
  testing.value = true;

  try {
    await api.settings.testReceiptPrinter(selectedPrinter.value);
    successMessage.value = 'Test chek yuborildi.';
  } catch (error) {
    errorMessage.value = mapErrorMessage(error);
  } finally {
    testing.value = false;
  }
}

onMounted(() => {
  loadPrinters();
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

.success-text {
  padding: var(--space-3);
  border: 1px solid #bbf7d0;
  border-radius: var(--radius-1);
  background: #f0fdf4;
  color: #166534;
}

.state-text {
  color: var(--color-text-muted);
}

.section {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.section-head {
  display: flex;
  flex-direction: column;
}

.section-title {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--color-text);
}

.field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  max-width: 480px;
}

.field-label {
  font-weight: 600;
  color: var(--color-text);
}

.select {
  width: 100%;
  min-height: 42px;
  padding: 8px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-1);
  background: var(--color-bg-surface);
  color: var(--color-text);
  font-size: var(--font-size-md);
}

.select:focus {
  outline: 2px solid #2563eb;
  outline-offset: 1px;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}
</style>
