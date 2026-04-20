const { ipcMain } = require('electron');
const service = require('../services/table.service');

function registerTableHandlers() {
  ipcMain.handle('table:getAll', () => {
    return service.getAll();
  });

  ipcMain.handle('table:getById', (_event, id) => {
    return service.getById(id);
  });

  ipcMain.handle('table:create', (_event, payload) => {
    return service.create(payload);
  });

  ipcMain.handle('table:update', (_event, { id, data }) => {
    return service.update(id, data);
  });

  ipcMain.handle('table:delete', (_event, id) => {
    return service.deleteById(id);
  });
}

module.exports = {
  registerTableHandlers,
};
