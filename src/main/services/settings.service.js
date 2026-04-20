const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');
const { app, BrowserWindow } = require('electron');

const settingsRepo = require('../db/repositories/settings.repository');

const execFileAsync = promisify(execFile);

const RECEIPT_PRINTER_KEY = 'receipt.printer.name';
const BINARY_NAME = process.platform === 'win32' ? 'receipt.exe' : 'receipt';
const PRINT_TIMEOUT_MS = 15000;

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

function getPrintLogPath() {
  const logsDir = path.join(app.getPath('userData'), 'logs');
  fs.mkdirSync(logsDir, { recursive: true });
  return path.join(logsDir, 'print.log');
}

function writePrintLog(payload) {
  const line = JSON.stringify({
    timestamp: new Date().toISOString(),
    ...payload,
  });

  fs.appendFileSync(getPrintLogPath(), `${line}\n`, 'utf8');
}

function normalizeExecError(error, stdout, stderr, meta) {
  writePrintLog({
    scope: 'settings.testReceiptPrinter',
    ok: false,
    ...meta,
    stdout,
    stderr,
    errorMessage: error?.message || '',
    exitCode: error?.code ?? null,
    signal: error?.signal ?? null,
    timedOut: error?.killed === true && error?.signal === 'SIGTERM',
    timeoutMs: PRINT_TIMEOUT_MS,
  });

  const normalized = new Error('RECEIPT_PRINT_FAILED');
  normalized.details = {
    stdout,
    stderr,
    exitCode: error?.code ?? null,
    signal: error?.signal ?? null,
    message: error?.message || '',
  };
  return normalized;
}

function getReceiptPrinterName() {
  return settingsRepo.getValue(RECEIPT_PRINTER_KEY);
}

async function listPrinters() {
  const windows = BrowserWindow.getAllWindows();
  const target = BrowserWindow.getFocusedWindow() || windows[0];

  if (!target || !target.webContents) {
    return [];
  }

  const printers = await target.webContents.getPrintersAsync();

  return printers.map((printer) => ({
    name: printer.name,
    displayName: printer.displayName || printer.name,
    description: printer.description || '',
    status: printer.status,
    isDefault: Boolean(printer.isDefault),
  }));
}

function getPrinterSettings() {
  return {
    receiptPrinterName: getReceiptPrinterName(),
  };
}

function savePrinterSettings({ receiptPrinterName } = {}) {
  const name = typeof receiptPrinterName === 'string' ? receiptPrinterName.trim() : '';

  if (!name) {
    throw new Error('INVALID_PRINTER_NAME');
  }

  settingsRepo.set(RECEIPT_PRINTER_KEY, name);

  return getPrinterSettings();
}

function pad(n) {
  return String(n).padStart(2, '0');
}

function formatNow() {
  const now = new Date();
  return `${pad(now.getDate())}.${pad(now.getMonth() + 1)}.${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

async function testReceiptPrinter(printerName) {
  const name = typeof printerName === 'string' ? printerName.trim() : '';
  const binaryPath = resolveBinaryPath();
  const meta = {
    binaryPath,
    selectedPrinterName: name,
    binaryCandidates: binaryCandidates(),
  };

  if (!name) {
    writePrintLog({
      scope: 'settings.testReceiptPrinter',
      ok: false,
      ...meta,
      errorMessage: 'Printer name is empty',
    });
    throw new Error('INVALID_PRINTER_NAME');
  }

  if (!binaryPath) {
    writePrintLog({
      scope: 'settings.testReceiptPrinter',
      ok: false,
      ...meta,
      errorMessage: 'Receipt binary not found',
    });
    throw new Error('RECEIPT_BINARY_NOT_FOUND');
  }

  const orderInfo = [
    'Test chek',
    `Printer: ${name}`,
    `Sana: ${formatNow()}`,
  ].join('\n');

  const args = [
    name,
    'Cafe',
    orderInfo,
    '',
    '0.00',
    '0.00',
    '0.00',
  ];

  writePrintLog({
    scope: 'settings.testReceiptPrinter',
    ok: true,
    phase: 'start',
    ...meta,
    argsPreview: args,
    timeoutMs: PRINT_TIMEOUT_MS,
  });

  try {
    const result = await execFileAsync(binaryPath, args, {
      windowsHide: true,
      timeout: PRINT_TIMEOUT_MS,
    });

    writePrintLog({
      scope: 'settings.testReceiptPrinter',
      ok: true,
      phase: 'success',
      ...meta,
      stdout: result.stdout || '',
      stderr: result.stderr || '',
      exitCode: 0,
      timeoutMs: PRINT_TIMEOUT_MS,
    });
  } catch (_error) {
    throw normalizeExecError(_error, _error?.stdout || '', _error?.stderr || '', meta);
  }

  return { ok: true };
}

module.exports = {
  RECEIPT_PRINTER_KEY,
  listPrinters,
  getPrinterSettings,
  savePrinterSettings,
  testReceiptPrinter,
  getReceiptPrinterName,
};
