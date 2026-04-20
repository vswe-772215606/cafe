const db = require('../index');

function getSummary(fromDate, toDate) {
  const statement = db.prepare(`
    SELECT
      COALESCE((
        SELECT SUM(orders.total_price)
        FROM orders
        WHERE orders.status = 'READY'
          AND orders.closed_at >= ?
          AND orders.closed_at <= ?
      ), 0) AS total_sales,
      COALESCE((
        SELECT COUNT(*)
        FROM orders
        WHERE orders.status = 'READY'
          AND orders.closed_at >= ?
          AND orders.closed_at <= ?
      ), 0) AS completed_orders_count,
      COALESCE((
        SELECT SUM(order_items.quantity)
        FROM order_items
        INNER JOIN orders ON orders.id = order_items.order_id
        WHERE orders.status = 'READY'
          AND orders.closed_at >= ?
          AND orders.closed_at <= ?
      ), 0) AS total_items_sold
  `);

  return statement.get(fromDate, toDate, fromDate, toDate, fromDate, toDate);
}

function getTopItems(fromDate, toDate, limit, offset) {
  const statement = db.prepare(`
    SELECT
      order_items.item_name AS item_name,
      order_items.type AS type,
      SUM(order_items.quantity) AS total_quantity,
      SUM(order_items.total_price) AS total_sales
    FROM order_items
    INNER JOIN orders ON orders.id = order_items.order_id
    WHERE orders.status = 'READY'
      AND orders.closed_at >= ?
      AND orders.closed_at <= ?
    GROUP BY order_items.item_name, order_items.type
    ORDER BY total_quantity DESC, total_sales DESC, item_name ASC
    LIMIT ? OFFSET ?
  `);

  return statement.all(fromDate, toDate, limit, offset);
}

function countTopItems(fromDate, toDate) {
  const statement = db.prepare(`
    SELECT COUNT(*) AS total FROM (
      SELECT 1
      FROM order_items
      INNER JOIN orders ON orders.id = order_items.order_id
      WHERE orders.status = 'READY'
        AND orders.closed_at >= ?
        AND orders.closed_at <= ?
      GROUP BY order_items.item_name, order_items.type
    )
  `);

  return statement.get(fromDate, toDate).total;
}

function getSalesByType(fromDate, toDate) {
  const statement = db.prepare(`
    SELECT
      order_items.type AS type,
      SUM(order_items.quantity) AS total_quantity,
      SUM(order_items.total_price) AS total_sales
    FROM order_items
    INNER JOIN orders ON orders.id = order_items.order_id
    WHERE orders.status = 'READY'
      AND orders.closed_at >= ?
      AND orders.closed_at <= ?
    GROUP BY order_items.type
    ORDER BY type ASC
  `);

  return statement.all(fromDate, toDate);
}

function getSalesByOrderType(fromDate, toDate) {
  const statement = db.prepare(`
    SELECT
      orders.order_type AS order_type,
      COUNT(*) AS orders_count,
      COALESCE(SUM(orders.total_price), 0) AS total_sales
    FROM orders
    WHERE orders.status = 'READY'
      AND orders.closed_at >= ?
      AND orders.closed_at <= ?
    GROUP BY orders.order_type
    ORDER BY orders.order_type ASC
  `);

  return statement.all(fromDate, toDate);
}

function getSalesByTable(fromDate, toDate, limit, offset) {
  const statement = db.prepare(`
    SELECT
      orders.table_id AS table_id,
      tables.number AS table_number,
      COUNT(*) AS completed_orders_count,
      COALESCE(SUM(orders.total_price), 0) AS total_sales
    FROM orders
    LEFT JOIN tables ON tables.id = orders.table_id
    WHERE orders.status = 'READY'
      AND orders.order_type = 'DINE_IN'
      AND orders.closed_at >= ?
      AND orders.closed_at <= ?
    GROUP BY orders.table_id, tables.number
    ORDER BY total_sales DESC, table_number ASC
    LIMIT ? OFFSET ?
  `);

  return statement.all(fromDate, toDate, limit, offset);
}

function countSalesByTable(fromDate, toDate) {
  const statement = db.prepare(`
    SELECT COUNT(*) AS total FROM (
      SELECT 1
      FROM orders
      LEFT JOIN tables ON tables.id = orders.table_id
      WHERE orders.status = 'READY'
        AND orders.order_type = 'DINE_IN'
        AND orders.closed_at >= ?
        AND orders.closed_at <= ?
      GROUP BY orders.table_id, tables.number
    )
  `);

  return statement.get(fromDate, toDate).total;
}

function getRecentReadyOrders(fromDate, toDate, limit, offset) {
  const statement = db.prepare(`
    SELECT
      orders.id AS id,
      orders.table_id AS table_id,
      tables.number AS table_number,
      orders.order_type AS order_type,
      orders.total_price AS total_price,
      orders.closed_at AS closed_at
    FROM orders
    LEFT JOIN tables ON tables.id = orders.table_id
    WHERE orders.status = 'READY'
      AND orders.closed_at >= ?
      AND orders.closed_at <= ?
    ORDER BY orders.closed_at DESC, orders.id DESC
    LIMIT ? OFFSET ?
  `);

  return statement.all(fromDate, toDate, limit, offset);
}

function countRecentReadyOrders(fromDate, toDate) {
  const statement = db.prepare(`
    SELECT COUNT(*) AS total
    FROM orders
    WHERE orders.status = 'READY'
      AND orders.closed_at >= ?
      AND orders.closed_at <= ?
  `);

  return statement.get(fromDate, toDate).total;
}

module.exports = {
  getSummary,
  getTopItems,
  countTopItems,
  getSalesByType,
  getSalesByOrderType,
  getSalesByTable,
  countSalesByTable,
  getRecentReadyOrders,
  countRecentReadyOrders,
};
