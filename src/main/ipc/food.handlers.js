const { ipcMain } = require('electron');
const service = require('../services/food.service');

function registerFoodHandlers() {
  ipcMain.handle('food:getAll', () => {
    return service.getAll();
  });

  ipcMain.handle('food:getById', (_event, id) => {
    return service.getById(id);
  });

  ipcMain.handle('food:getByFoodGroupId', (_event, foodGroupId) => {
    return service.getByFoodGroupId(foodGroupId);
  });

  ipcMain.handle('food:create', (_event, payload) => {
    return service.create(payload);
  });

  ipcMain.handle('food:update', (_event, { id, data }) => {
    return service.update(id, data);
  });

  ipcMain.handle('food:setActive', (_event, { id, isActive }) => {
    return service.setActive(id, isActive);
  });

  ipcMain.handle('food:delete', (_event, id) => {
    return service.deleteById(id);
  });
}

module.exports = {
  registerFoodHandlers,
};
