const { ipcMain } = require('electron');
const service = require('../services/order.service');

function registerOrderHandlers() {
  ipcMain.handle('order:getById', (_event, id) => {
    return service.getById(id);
  });

  ipcMain.handle('order:getOpenDineInByTableId', (_event, tableId) => {
    return service.getOpenDineInByTableId(tableId);
  });

  ipcMain.handle('order:getOrCreateDineInByTableId', (_event, tableId) => {
    return service.getOrCreateDineInByTableId(tableId);
  });

  ipcMain.handle('order:createTakeawayOrder', () => {
    return service.createTakeawayOrder();
  });

  ipcMain.handle('order:addFoodItemToOrder', (_event, { orderId, data }) => {
    return service.addFoodItemToOrder(orderId, data);
  });

  ipcMain.handle('order:addComboItemToOrder', (_event, { orderId, data }) => {
    return service.addComboItemToOrder(orderId, data);
  });

  ipcMain.handle('order:updateItemQuantity', (_event, { orderId, itemId, quantity }) => {
    return service.updateItemQuantity(orderId, itemId, quantity);
  });

  ipcMain.handle('order:removeItem', (_event, { orderId, itemId }) => {
    return service.removeItem(orderId, itemId);
  });

  ipcMain.handle('order:close', (_event, orderId) => {
    return service.close(orderId);
  });

  ipcMain.handle('order:cancel', (_event, orderId) => {
    return service.cancel(orderId);
  });
}

module.exports = {
  registerOrderHandlers,
};
