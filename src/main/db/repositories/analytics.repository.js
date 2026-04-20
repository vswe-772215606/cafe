const db = require('../index');

function getSummary(fromDate, toDate) {
  const statement = db.prepare(`
    SELECT
      COALESCE((
        SELECT SUM(orders.total_price)
        FROM orders
        WHERE orders.status = 'DONE'
          AND orders.closed_at >= ?
          AND orders.closed_at <= ?
      ), 0) AS total_sales,
      COALESCE((
        SELECT COUNT(*)
        FROM orders
        WHERE orders.status = 'DONE'
          AND orders.closed_at >= ?
          AND orders.closed_at <= ?
      ), 0) AS completed_orders_count,
      COALESCE((
        SELECT SUM(order_items.quantity)
        FROM order_items
        INNER JOIN orders ON orders.id = order_items.order_id
        WHERE orders.status = 'DONE'
          AND orders.closed_at >= ?
          AND orders.closed_at <= ?
      ), 0) AS total_items_sold
  `);

  return statement.get(fromDate, toDate, fromDate, toDate, fromDate, toDate);
}

function getTopItems(fromDate, toDate, limit) {
  const statement = db.prepare(`
    SELECT
      order_items.item_name AS item_name,
      order_items.type AS type,
      SUM(order_items.quantity) AS total_quantity,
      SUM(order_items.total_price) AS total_sales
    FROM order_items
    INNER JOIN orders ON orders.id = order_items.order_id
    WHERE orders.status = 'DONE'
      AND orders.closed_at >= ?
      AND orders.closed_at <= ?
    GROUP BY order_items.item_name, order_items.type
    ORDER BY total_quantity DESC, total_sales DESC, item_name ASC
    LIMIT ?
  `);

  return statement.all(fromDate, toDate, limit);
}

function getSalesByType(fromDate, toDate) {
  const statement = db.prepare(`
    SELECT
      order_items.type AS type,
      SUM(order_items.quantity) AS total_quantity,
      SUM(order_items.total_price) AS total_sales
    FROM order_items
    INNER JOIN orders ON orders.id = order_items.order_id
    WHERE orders.status = 'DONE'
      AND orders.closed_at >= ?
      AND orders.closed_at <= ?
    GROUP BY order_items.type
    ORDER BY type ASC
  `);

  return statement.all(fromDate, toDate);
}

function getSalesByTable(fromDate, toDate) {
  const statement = db.prepare(`
    SELECT
      orders.table_id AS table_id,
      tables.number AS table_number,
      COUNT(*) AS completed_orders_count,
      SUM(orders.total_price) AS total_sales
    FROM orders
    INNER JOIN tables ON tables.id = orders.table_id
    WHERE orders.status = 'DONE'
      AND orders.closed_at >= ?
      AND orders.closed_at <= ?
    GROUP BY orders.table_id, tables.number
    ORDER BY total_sales DESC, table_number ASC
  `);

  return statement.all(fromDate, toDate);
}

function getRecentCompletedOrders(limit) {
  const statement = db.prepare(`
    SELECT
      orders.id AS id,
      orders.table_id AS table_id,
      orders.total_price AS total_price,
      orders.closed_at AS closed_at
    FROM orders
    WHERE orders.status = 'DONE'
    ORDER BY orders.closed_at DESC
    LIMIT ?
  `);

  return statement.all(limit);
}

module.exports = {
  getSummary,
  getTopItems,
  getSalesByType,
  getSalesByTable,
  getRecentCompletedOrders,
};
