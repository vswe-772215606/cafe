const { BrowserWindow, dialog, ipcMain } = require('electron');
const service = require('../services/analytics.service');
const exportService = require('../services/analytics-export.service');

function registerAnalyticsHandlers() {
  ipcMain.handle('analytics:getSummary', (_event, payload) => {
    return service.getSummary(payload);
  });

  ipcMain.handle('analytics:getTopItems', (_event, payload) => {
    return service.getTopItems(payload);
  });

  ipcMain.handle('analytics:getSalesByType', (_event, payload) => {
    return service.getSalesByType(payload);
  });

  ipcMain.handle('analytics:getSalesByOrderType', (_event, payload) => {
    return service.getSalesByOrderType(payload);
  });

  ipcMain.handle('analytics:getSalesByTable', (_event, payload) => {
    return service.getSalesByTable(payload);
  });

  ipcMain.handle('analytics:getRecent', (_event, payload) => {
    return service.getRecent(payload);
  });

  ipcMain.handle('analytics:exportExcel', async (event, payload) => {
    const workbook = exportService.buildWorkbook(payload || {});

    const window = BrowserWindow.fromWebContents(event.sender);
    const defaultFileName = `hisobot_${payload?.fromDate || ''}_${payload?.toDate || ''}.xlsx`.replace(/__+/g, '_');

    const dialogOptions = {
      title: 'Excel faylni saqlash',
      defaultPath: defaultFileName,
      filters: [{ name: 'Excel', extensions: ['xlsx'] }],
    };

    const result = window
      ? await dialog.showSaveDialog(window, dialogOptions)
      : await dialog.showSaveDialog(dialogOptions);

    if (result.canceled || !result.filePath) {
      return { cancelled: true };
    }

    exportService.writeWorkbookToFile(workbook, result.filePath);

    return { cancelled: false, filePath: result.filePath };
  });
}

module.exports = {
  registerAnalyticsHandlers,
};
