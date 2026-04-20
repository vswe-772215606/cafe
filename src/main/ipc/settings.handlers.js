const { ipcMain } = require('electron');
const service = require('../services/settings.service');

function registerSettingsHandlers() {
  ipcMain.handle('settings:listPrinters', () => {
    return service.listPrinters();
  });

  ipcMain.handle('settings:getPrinterSettings', () => {
    return service.getPrinterSettings();
  });

  ipcMain.handle('settings:savePrinterSettings', (_event, payload) => {
    return service.savePrinterSettings(payload);
  });

  ipcMain.handle('settings:testReceiptPrinter', (_event, printerName) => {
    return service.testReceiptPrinter(printerName);
  });
}

module.exports = {
  registerSettingsHandlers,
};
