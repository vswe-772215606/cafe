const { ipcMain } = require('electron');
const service = require('../services/analytics.service');

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

  ipcMain.handle('analytics:getSalesByTable', (_event, payload) => {
    return service.getSalesByTable(payload);
  });

  ipcMain.handle('analytics:getSalesByOrderType', (_event, payload) => {
    return service.getSalesByOrderType(payload);
  });

  ipcMain.handle('analytics:getRecentCompletedOrders', (_event, limit) => {
    return service.getRecentCompletedOrders(limit);
  });
}

module.exports = {
  registerAnalyticsHandlers,
};
