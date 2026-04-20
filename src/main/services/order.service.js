const orderRepo = require('../db/repositories/order.repository');
const tableRepo = require('../db/repositories/table.repository');
const foodRepo = require('../db/repositories/food.repository');
const comboRepo = require('../db/repositories/combo.repository');

function getById(id) {
  id = Number(id);

  if (!Number.isInteger(id) || id <= 0) {
    throw new Error('INVALID_ID');
  }

  const order = orderRepo.getByIdWithItems(id);

  if (!order) {
    throw new Error('ORDER_NOT_FOUND');
  }

  return order;
}

function getOpenDineInByTableId(tableId) {
  tableId = Number(tableId);

  if (!Number.isInteger(tableId) || tableId <= 0) {
    throw new Error('INVALID_TABLE_ID');
  }

  const table = tableRepo.getById(tableId);

  if (!table) {
    throw new Error('TABLE_NOT_FOUND');
  }

  return orderRepo.getOpenDineInByTableId(tableId) || null;
}

function getOrCreateDineInByTableId(tableId) {
  tableId = Number(tableId);

  if (!Number.isInteger(tableId) || tableId <= 0) {
    throw new Error('INVALID_TABLE_ID');
  }

  const table = tableRepo.getById(tableId);

  if (!table) {
    throw new Error('TABLE_NOT_FOUND');
  }

  const existingOrder = orderRepo.getOpenDineInByTableId(tableId);

  if (existingOrder) {
    return orderRepo.getByIdWithItems(existingOrder.id);
  }

  const createdOrder = orderRepo.create({
    tableId,
    orderType: 'DINE_IN',
  });

  return orderRepo.getByIdWithItems(createdOrder.id);
}

function createTakeawayOrder() {
  const createdOrder = orderRepo.create({
    tableId: null,
    orderType: 'TAKEAWAY',
  });

  return orderRepo.getByIdWithItems(createdOrder.id);
}

function listOpenDineInOrders() {
  return orderRepo.listOpenDineInOrders();
}

function listOpenTakeawayOrders() {
  return orderRepo.listOpenTakeawayOrders();
}

function listRecentOrders(limit) {
  limit = Number(limit);

  if (!Number.isInteger(limit) || limit <= 0) {
    throw new Error('INVALID_LIMIT');
  }

  return orderRepo.listRecentOrders(limit);
}

function listReadyOrders(limit) {
  limit = Number(limit);

  if (!Number.isInteger(limit) || limit <= 0) {
    throw new Error('INVALID_LIMIT');
  }

  return orderRepo.listReadyOrders(limit);
}

function addFoodItemToOrder(orderId, { foodId, quantity }) {
  orderId = Number(orderId);
  foodId = Number(foodId);
  quantity = Number(quantity);

  if (!Number.isInteger(orderId) || orderId <= 0) {
    throw new Error('INVALID_ORDER_ID');
  }

  if (!Number.isInteger(foodId) || foodId <= 0) {
    throw new Error('INVALID_FOOD_ID');
  }

  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new Error('INVALID_QUANTITY');
  }

  const order = orderRepo.getByIdWithItems(orderId);

  if (!order) {
    throw new Error('ORDER_NOT_FOUND');
  }

  if (order.status !== 'OPEN') {
    throw new Error('ORDER_NOT_OPEN');
  }

  const food = foodRepo.getById(foodId);

  if (!food) {
    throw new Error('FOOD_NOT_FOUND');
  }

  if (food.is_active !== 1) {
    throw new Error('FOOD_INACTIVE');
  }

  orderRepo.addItem({
    orderId: order.id,
    type: 'FOOD',
    foodId: food.id,
    comboId: null,
    itemName: food.name,
    unitPrice: food.price,
    quantity,
    totalPrice: food.price * quantity,
  });

  const updatedOrder = orderRepo.getByIdWithItems(order.id);
  const totalPrice = updatedOrder.items.reduce((sum, item) => sum + item.total_price, 0);

  orderRepo.updateTotal(order.id, totalPrice);

  return orderRepo.getByIdWithItems(order.id);
}

function addComboItemToOrder(orderId, { comboId, quantity }) {
  orderId = Number(orderId);
  comboId = Number(comboId);
  quantity = Number(quantity);

  if (!Number.isInteger(orderId) || orderId <= 0) {
    throw new Error('INVALID_ORDER_ID');
  }

  if (!Number.isInteger(comboId) || comboId <= 0) {
    throw new Error('INVALID_COMBO_ID');
  }

  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new Error('INVALID_QUANTITY');
  }

  const order = orderRepo.getByIdWithItems(orderId);

  if (!order) {
    throw new Error('ORDER_NOT_FOUND');
  }

  if (order.status !== 'OPEN') {
    throw new Error('ORDER_NOT_OPEN');
  }

  const combo = comboRepo.getById(comboId);

  if (!combo) {
    throw new Error('COMBO_NOT_FOUND');
  }

  if (combo.is_active !== 1) {
    throw new Error('COMBO_INACTIVE');
  }

  orderRepo.addItem({
    orderId: order.id,
    type: 'COMBO',
    foodId: null,
    comboId: combo.id,
    itemName: combo.name,
    unitPrice: combo.price,
    quantity,
    totalPrice: combo.price * quantity,
  });

  const updatedOrder = orderRepo.getByIdWithItems(order.id);
  const totalPrice = updatedOrder.items.reduce((sum, item) => sum + item.total_price, 0);

  orderRepo.updateTotal(order.id, totalPrice);

  return orderRepo.getByIdWithItems(order.id);
}

function updateItemQuantity(orderId, itemId, quantity) {
  orderId = Number(orderId);
  itemId = Number(itemId);
  quantity = Number(quantity);

  if (!Number.isInteger(orderId) || orderId <= 0) {
    throw new Error('INVALID_ORDER_ID');
  }

  if (!Number.isInteger(itemId) || itemId <= 0) {
    throw new Error('INVALID_ITEM_ID');
  }

  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new Error('INVALID_QUANTITY');
  }

  const order = orderRepo.getByIdWithItems(orderId);

  if (!order) {
    throw new Error('ORDER_NOT_FOUND');
  }

  if (order.status !== 'OPEN') {
    throw new Error('ORDER_NOT_OPEN');
  }

  const item = order.items.find((orderItem) => orderItem.id === itemId);

  if (!item) {
    throw new Error('ORDER_ITEM_NOT_FOUND');
  }

  orderRepo.updateItemQuantity(itemId, quantity, item.unit_price * quantity);

  const updatedOrder = orderRepo.getByIdWithItems(orderId);
  const totalPrice = updatedOrder.items.reduce((sum, orderItem) => sum + orderItem.total_price, 0);

  orderRepo.updateTotal(orderId, totalPrice);

  return orderRepo.getByIdWithItems(orderId);
}

function removeItem(orderId, itemId) {
  orderId = Number(orderId);
  itemId = Number(itemId);

  if (!Number.isInteger(orderId) || orderId <= 0) {
    throw new Error('INVALID_ORDER_ID');
  }

  if (!Number.isInteger(itemId) || itemId <= 0) {
    throw new Error('INVALID_ITEM_ID');
  }

  const order = orderRepo.getByIdWithItems(orderId);

  if (!order) {
    throw new Error('ORDER_NOT_FOUND');
  }

  if (order.status !== 'OPEN') {
    throw new Error('ORDER_NOT_OPEN');
  }

  const item = order.items.find((orderItem) => orderItem.id === itemId);

  if (!item) {
    throw new Error('ORDER_ITEM_NOT_FOUND');
  }

  orderRepo.deleteItem(itemId);

  const updatedOrder = orderRepo.getByIdWithItems(orderId);
  const totalPrice = updatedOrder.items.reduce((sum, orderItem) => sum + orderItem.total_price, 0);

  orderRepo.updateTotal(orderId, totalPrice);

  return orderRepo.getByIdWithItems(orderId);
}

function markReady(orderId) {
  orderId = Number(orderId);

  if (!Number.isInteger(orderId) || orderId <= 0) {
    throw new Error('INVALID_ORDER_ID');
  }

  const order = orderRepo.getByIdWithItems(orderId);

  if (!order) {
    throw new Error('ORDER_NOT_FOUND');
  }

  if (order.status !== 'OPEN') {
    throw new Error('ORDER_NOT_OPEN');
  }

  if (order.items.length === 0) {
    throw new Error('ORDER_EMPTY');
  }

  const closedAt = new Date().toISOString();

  orderRepo.setStatus(orderId, 'READY', closedAt);

  return orderRepo.getByIdWithItems(orderId);
}

function cancel(orderId) {
  orderId = Number(orderId);

  if (!Number.isInteger(orderId) || orderId <= 0) {
    throw new Error('INVALID_ORDER_ID');
  }

  const order = orderRepo.getByIdWithItems(orderId);

  if (!order) {
    throw new Error('ORDER_NOT_FOUND');
  }

  if (order.status !== 'OPEN') {
    throw new Error('ORDER_NOT_OPEN');
  }

  const closedAt = new Date().toISOString();

  orderRepo.setStatus(orderId, 'CANCELLED', closedAt);

  return orderRepo.getByIdWithItems(orderId);
}

module.exports = {
  getById,
  getOpenDineInByTableId,
  getOrCreateDineInByTableId,
  createTakeawayOrder,
  addFoodItemToOrder,
  addComboItemToOrder,
  updateItemQuantity,
  removeItem,
  markReady,
  cancel,
  listOpenDineInOrders,
  listOpenTakeawayOrders,
  listRecentOrders,
  listReadyOrders,
};
