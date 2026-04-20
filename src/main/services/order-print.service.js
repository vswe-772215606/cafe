const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');
const { app } = require('electron');

const orderRepo = require('../db/repositories/order.repository');
const settingsService = require('./settings.service');

const execFileAsync = promisify(execFile);

const STORE_HEADING = process.env.CAFE_RECEIPT_HEADING || 'Cafe';
const BINARY_NAME = process.platform === 'win32' ? 'receipt.exe' : 'receipt';

function binaryCandidates() {
  const results = [];

  if (app.isPackaged) {
    results.push(path.join(process.resourcesPath, 'bin', BINARY_NAME));
  }

  results.push(path.join(app.getAppPath(), 'resources', 'bin', BINARY_NAME));
  results.push(path.join(__dirname, '..', '..', '..', 'resources', 'bin', BINARY_NAME));

  return results;
}

function resolveBinaryPath() {
  for (const candidate of binaryCandidates()) {
    if (candidate && fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

function sanitize(value) {
  return String(value ?? '')
    .replace(/[|;\r\n]/g, ' ')
    .trim();
}

function formatPrice(value) {
  return Number(value || 0).toFixed(2);
}

function formatDate(value) {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const pad = (n) => String(n).padStart(2, '0');

  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function buildOrderInfo(order) {
  const lines = [`Buyurtma #${order.id}`];

  if (order.order_type === 'DINE_IN' && order.table_number != null) {
    lines.push(`Stol: ${order.table_number}`);
  }

  lines.push(`Tur: ${order.order_type === 'DINE_IN' ? 'Zalda' : 'Olib ketish'}`);

  const printedAt = formatDate(order.closed_at || order.updated_at || order.created_at);

  if (printedAt) {
    lines.push(`Sana: ${printedAt}`);
  }

  return lines.map(sanitize).join('\n');
}

function buildItemsData(items) {
  return items
    .map((item) =>
      [
        sanitize(item.item_name),
        Number(item.quantity || 0),
        formatPrice(item.unit_price),
        formatPrice(item.total_price),
      ].join('|')
    )
    .join(';');
}

async function printOrderReceipt(orderId) {
  orderId = Number(orderId);

  if (!Number.isInteger(orderId) || orderId <= 0) {
    throw new Error('INVALID_ORDER_ID');
  }

  const order = orderRepo.getByIdWithItems(orderId);

  if (!order) {
    throw new Error('ORDER_NOT_FOUND');
  }

  if (order.status !== 'READY') {
    throw new Error('ORDER_NOT_READY');
  }

  const binaryPath = resolveBinaryPath();

  if (!binaryPath) {
    throw new Error('RECEIPT_BINARY_NOT_FOUND');
  }

  const printerName =
    settingsService.getReceiptPrinterName() ||
    process.env.CAFE_RECEIPT_PRINTER ||
    '';

  if (!printerName) {
    throw new Error('PRINTER_NOT_FOUND');
  }

  const subtotal = formatPrice(order.total_price);
  const discount = formatPrice(0);
  const total = formatPrice(order.total_price);

  const args = [
    printerName,
    STORE_HEADING,
    buildOrderInfo(order),
    buildItemsData(order.items || []),
    subtotal,
    discount,
    total,
  ];

  try {
    await execFileAsync(binaryPath, args, {
      windowsHide: true,
      timeout: 15000,
    });
  } catch (_error) {
    throw new Error('RECEIPT_PRINT_FAILED');
  }

  return { ok: true, orderId: order.id };
}

module.exports = {
  printOrderReceipt,
};
