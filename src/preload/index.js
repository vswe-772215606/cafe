const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  foodGroup: {
    getAll: () => ipcRenderer.invoke('foodGroup:getAll'),
    create: (payload) => ipcRenderer.invoke('foodGroup:create', payload),
    update: (id, data) => ipcRenderer.invoke('foodGroup:update', { id, data }),
    delete: (id) => ipcRenderer.invoke('foodGroup:delete', id),
  },
  food: {
    getAll: () => ipcRenderer.invoke('food:getAll'),
    getById: (id) => ipcRenderer.invoke('food:getById', id),
    getByFoodGroupId: (foodGroupId) => ipcRenderer.invoke('food:getByFoodGroupId', foodGroupId),
    create: (payload) => ipcRenderer.invoke('food:create', payload),
    update: (id, data) => ipcRenderer.invoke('food:update', { id, data }),
    setActive: (id, isActive) => ipcRenderer.invoke('food:setActive', { id, isActive }),
    delete: (id) => ipcRenderer.invoke('food:delete', id),
  },
  table: {
    getAll: () => ipcRenderer.invoke('table:getAll'),
    getById: (id) => ipcRenderer.invoke('table:getById', id),
    create: (payload) => ipcRenderer.invoke('table:create', payload),
    update: (id, data) => ipcRenderer.invoke('table:update', { id, data }),
    delete: (id) => ipcRenderer.invoke('table:delete', id),
  },
  combo: {
    getAll: () => ipcRenderer.invoke('combo:getAll'),
    getById: (id) => ipcRenderer.invoke('combo:getById', id),
    create: (payload) => ipcRenderer.invoke('combo:create', payload),
    update: (id, data) => ipcRenderer.invoke('combo:update', { id, data }),
    setActive: (id, isActive) => ipcRenderer.invoke('combo:setActive', { id, isActive }),
    delete: (id) => ipcRenderer.invoke('combo:delete', id),
  },
  order: {
    getById: (id) => ipcRenderer.invoke('order:getById', id),
    getOpenDineInByTableId: (tableId) => ipcRenderer.invoke('order:getOpenDineInByTableId', tableId),
    getOrCreateDineInByTableId: (tableId) => ipcRenderer.invoke('order:getOrCreateDineInByTableId', tableId),
    createTakeawayOrder: () => ipcRenderer.invoke('order:createTakeawayOrder'),
    addFoodItemToOrder: (orderId, data) => ipcRenderer.invoke('order:addFoodItemToOrder', { orderId, data }),
    addComboItemToOrder: (orderId, data) => ipcRenderer.invoke('order:addComboItemToOrder', { orderId, data }),
    updateItemQuantity: (orderId, itemId, quantity) =>
      ipcRenderer.invoke('order:updateItemQuantity', { orderId, itemId, quantity }),
    removeItem: (orderId, itemId) => ipcRenderer.invoke('order:removeItem', { orderId, itemId }),
    close: (orderId) => ipcRenderer.invoke('order:close', orderId),
    cancel: (orderId) => ipcRenderer.invoke('order:cancel', orderId),
  },
  analytics: {
    getSummary: (payload) => ipcRenderer.invoke('analytics:getSummary', payload),
    getTopItems: (payload) => ipcRenderer.invoke('analytics:getTopItems', payload),
    getSalesByType: (payload) => ipcRenderer.invoke('analytics:getSalesByType', payload),
    getSalesByTable: (payload) => ipcRenderer.invoke('analytics:getSalesByTable', payload),
    getRecentCompletedOrders: (limit) => ipcRenderer.invoke('analytics:getRecentCompletedOrders', limit),
  },
});
