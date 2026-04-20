const db = require('../index');

const SELECT_ORDERS_SQL = `
  SELECT
    orders.id AS id,
    orders.table_id AS table_id,
    tables.number AS table_number,
    orders.order_type AS order_type,
    orders.status AS status,
    orders.total_price AS total_price,
    orders.created_at AS created_at,
    orders.updated_at AS updated_at,
    orders.closed_at AS closed_at
  FROM orders
  LEFT JOIN tables ON tables.id = orders.table_id
`;

const SELECT_ORDER_ITEMS_SQL = `
  SELECT
    order_items.id AS id,
    order_items.order_id AS order_id,
    order_items.type AS type,
    order_items.food_id AS food_id,
    order_items.combo_id AS combo_id,
    order_items.item_name AS item_name,
    order_items.unit_price AS unit_price,
    order_items.quantity AS quantity,
    order_items.total_price AS total_price,
    order_items.created_at AS created_at,
    order_items.updated_at AS updated_at
  FROM order_items
`;

function getById(id) {
  const statement = db.prepare(`
    ${SELECT_ORDERS_SQL}
    WHERE orders.id = ?
  `);

  return statement.get(id);
}

function getItemsByOrderId(orderId) {
  const statement = db.prepare(`
    ${SELECT_ORDER_ITEMS_SQL}
    WHERE order_items.order_id = ?
    ORDER BY order_items.created_at ASC
  `);

  return statement.all(orderId);
}

function getByIdWithItems(id) {
  const order = getById(id);

  if (!order) {
    return undefined;
  }

  return {
    ...order,
    items: getItemsByOrderId(id),
  };
}

function getOpenDineInByTableId(tableId) {
  const statement = db.prepare(`
    ${SELECT_ORDERS_SQL}
    WHERE orders.table_id = ?
      AND orders.order_type = 'DINE_IN'
      AND orders.status = 'OPEN'
  `);

  return statement.get(tableId);
}

function listOpenDineInOrders() {
  const statement = db.prepare(`
    ${SELECT_ORDERS_SQL}
    WHERE orders.order_type = 'DINE_IN'
      AND orders.status = 'OPEN'
    ORDER BY orders.created_at ASC
  `);

  return statement.all();
}

function listOpenTakeawayOrders() {
  const statement = db.prepare(`
    ${SELECT_ORDERS_SQL}
    WHERE orders.order_type = 'TAKEAWAY'
      AND orders.status = 'OPEN'
    ORDER BY orders.created_at ASC
  `);

  return statement.all();
}

function listRecentOrders(limit) {
  const statement = db.prepare(`
    ${SELECT_ORDERS_SQL}
    ORDER BY orders.created_at DESC
    LIMIT ?
  `);

  return statement.all(limit);
}

function create({ tableId, orderType }) {
  const now = new Date().toISOString();

  const statement = db.prepare(`
    INSERT INTO orders (table_id, order_type, status, total_price, created_at, updated_at)
    VALUES (?, ?, 'OPEN', 0, ?, ?)
  `);

  const result = statement.run(tableId, orderType, now, now);

  return getById(result.lastInsertRowid);
}

function addItem({
  orderId,
  type,
  foodId,
  comboId,
  itemName,
  unitPrice,
  quantity,
  totalPrice,
}) {
  const now = new Date().toISOString();

  const insertStatement = db.prepare(`
    INSERT INTO order_items (
      order_id,
      type,
      food_id,
      combo_id,
      item_name,
      unit_price,
      quantity,
      total_price,
      created_at,
      updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const getItemByIdStatement = db.prepare(`
    ${SELECT_ORDER_ITEMS_SQL}
    WHERE order_items.id = ?
  `);

  const result = insertStatement.run(
    orderId,
    type,
    foodId,
    comboId,
    itemName,
    unitPrice,
    quantity,
    totalPrice,
    now,
    now
  );

  return getItemByIdStatement.get(result.lastInsertRowid);
}

function updateItemQuantity(itemId, quantity, totalPrice) {
  const now = new Date().toISOString();

  const updateStatement = db.prepare(`
    UPDATE order_items
    SET quantity = ?, total_price = ?, updated_at = ?
    WHERE id = ?
  `);

  const getItemByIdStatement = db.prepare(`
    ${SELECT_ORDER_ITEMS_SQL}
    WHERE order_items.id = ?
  `);

  const result = updateStatement.run(quantity, totalPrice, now, itemId);

  if (result.changes === 0) {
    return undefined;
  }

  return getItemByIdStatement.get(itemId);
}

function deleteItem(itemId) {
  const statement = db.prepare(`
    DELETE FROM order_items
    WHERE id = ?
  `);

  const result = statement.run(itemId);

  return result.changes > 0;
}

function updateTotal(orderId, totalPrice) {
  const now = new Date().toISOString();

  const statement = db.prepare(`
    UPDATE orders
    SET total_price = ?, updated_at = ?
    WHERE id = ?
  `);

  statement.run(totalPrice, now, orderId);

  return getById(orderId);
}

function setStatus(orderId, status, closedAt) {
  const now = new Date().toISOString();

  const statement = db.prepare(`
    UPDATE orders
    SET status = ?, closed_at = ?, updated_at = ?
    WHERE id = ?
  `);

  statement.run(status, closedAt, now, orderId);

  return getById(orderId);
}

module.exports = {
  getById,
  getItemsByOrderId,
  getByIdWithItems,
  getOpenDineInByTableId,
  listOpenDineInOrders,
  listOpenTakeawayOrders,
  listRecentOrders,
  create,
  addItem,
  updateItemQuantity,
  deleteItem,
  updateTotal,
  setStatus,
};
