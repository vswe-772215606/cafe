const { ipcMain } = require('electron');
const service = require('../services/food-group.service');

function registerFoodGroupHandlers() {
  ipcMain.handle('foodGroup:getAll', () => {
    return service.getAll();
  });

  ipcMain.handle('foodGroup:create', (_event, payload) => {
    return service.create(payload);
  });

  ipcMain.handle('foodGroup:update', (_event, { id, data }) => {
    return service.update(id, data);
  });

  ipcMain.handle('foodGroup:delete', (_event, id) => {
    return service.deleteById(id);
  });
}

module.exports = {
  registerFoodGroupHandlers,
};
