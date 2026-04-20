const { ipcMain } = require('electron');
const service = require('../services/combo.service');

function registerComboHandlers() {
  ipcMain.handle('combo:getAll', () => {
    return service.getAll();
  });

  ipcMain.handle('combo:getById', (_event, id) => {
    return service.getById(id);
  });

  ipcMain.handle('combo:create', (_event, payload) => {
    return service.create(payload);
  });

  ipcMain.handle('combo:update', (_event, { id, data }) => {
    return service.update(id, data);
  });

  ipcMain.handle('combo:setActive', (_event, { id, isActive }) => {
    return service.setActive(id, isActive);
  });

  ipcMain.handle('combo:delete', (_event, id) => {
    return service.deleteById(id);
  });
}

module.exports = {
  registerComboHandlers,
};
