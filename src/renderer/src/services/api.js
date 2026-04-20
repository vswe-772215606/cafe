export const api = {
  foodGroup: {
    getAll: () => window.api.foodGroup.getAll(),
    create: (data) => window.api.foodGroup.create(data),
    update: (id, data) => window.api.foodGroup.update(id, data),
    delete: (id) => window.api.foodGroup.delete(id),
  },

  food: {
    getAll: () => window.api.food.getAll(),
    getById: (id) => window.api.food.getById(id),
    getByFoodGroupId: (id) => window.api.food.getByFoodGroupId(id),
    create: (data) => window.api.food.create(data),
    update: (id, data) => window.api.food.update(id, data),
    setActive: (id, isActive) => window.api.food.setActive(id, isActive),
  },

  table: {
    getAll: () => window.api.table.getAll(),
    getById: (id) => window.api.table.getById(id),
    create: (data) => window.api.table.create(data),
    update: (id, data) => window.api.table.update(id, data),
    delete: (id) => window.api.table.delete(id),
  },

  combo: {
    getAll: () => window.api.combo.getAll(),
    getById: (id) => window.api.combo.getById(id),
    create: (data) => window.api.combo.create(data),
    update: (id, data) => window.api.combo.update(id, data),
    setActive: (id, isActive) => window.api.combo.setActive(id, isActive),
  },

  order: {
    getById: (id) => window.api.order.getById(id),
    getOpenDineInByTableId: (tableId) =>
      window.api.order.getOpenDineInByTableId(tableId),
    getOrCreateDineInByTableId: (tableId) =>
      window.api.order.getOrCreateDineInByTableId(tableId),
    createTakeawayOrder: () =>
      window.api.order.createTakeawayOrder(),
    addFoodItemToOrder: (orderId, data) =>
      window.api.order.addFoodItemToOrder(orderId, data),
    addComboItemToOrder: (orderId, data) =>
      window.api.order.addComboItemToOrder(orderId, data),
    updateItemQuantity: (orderId, itemId, quantity) =>
      window.api.order.updateItemQuantity(orderId, itemId, quantity),
    removeItem: (orderId, itemId) => window.api.order.removeItem(orderId, itemId),
    close: (orderId) => window.api.order.close(orderId),
    cancel: (orderId) => window.api.order.cancel(orderId),
  },

  analytics: {
    getSummary: (data) => window.api.analytics.getSummary(data),
    getTopItems: (data) => window.api.analytics.getTopItems(data),
    getSalesByType: (data) => window.api.analytics.getSalesByType(data),
    getSalesByTable: (data) => window.api.analytics.getSalesByTable(data),
    getRecent: (limit) => window.api.analytics.getRecentCompletedOrders(limit),
  },
};
