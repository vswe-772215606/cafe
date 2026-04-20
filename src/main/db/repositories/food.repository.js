const db = require('../index');

const SELECT_FOODS_SQL = `
  SELECT
    foods.id AS id,
    foods.name AS name,
    foods.price AS price,
    foods.is_active AS is_active,
    foods.food_group_id AS food_group_id,
    foods.created_at AS created_at,
    foods.updated_at AS updated_at,
    food_groups.name AS food_group_name
  FROM foods
  INNER JOIN food_groups ON food_groups.id = foods.food_group_id
`;

function getAll() {
  const statement = db.prepare(`
    ${SELECT_FOODS_SQL}
    ORDER BY foods.name ASC
  `);

  return statement.all();
}

function getById(id) {
  const statement = db.prepare(`
    ${SELECT_FOODS_SQL}
    WHERE foods.id = ?
  `);

  return statement.get(id);
}

function getByFoodGroupId(foodGroupId) {
  const statement = db.prepare(`
    ${SELECT_FOODS_SQL}
    WHERE foods.food_group_id = ?
    ORDER BY foods.name ASC
  `);

  return statement.all(foodGroupId);
}

function create({ name, price, foodGroupId }) {
  const now = new Date().toISOString();

  const statement = db.prepare(`
    INSERT INTO foods (name, price, food_group_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  const result = statement.run(name, price, foodGroupId, now, now);

  return getById(result.lastInsertRowid);
}

function update(id, { name, price, foodGroupId }) {
  const now = new Date().toISOString();

  const statement = db.prepare(`
    UPDATE foods
    SET name = ?, price = ?, food_group_id = ?, updated_at = ?
    WHERE id = ?
  `);

  const result = statement.run(name, price, foodGroupId, now, id);

  if (result.changes === 0) {
    return undefined;
  }

  return getById(id);
}

function setActive(id, isActive) {
  const now = new Date().toISOString();
  const activeValue = isActive ? 1 : 0;

  const statement = db.prepare(`
    UPDATE foods
    SET is_active = ?, updated_at = ?
    WHERE id = ?
  `);

  const result = statement.run(activeValue, now, id);

  if (result.changes === 0) {
    return undefined;
  }

  return getById(id);
}

function isUsedInCombos(id) {
  const statement = db.prepare(`
    SELECT 1
    FROM combo_items
    WHERE combo_items.food_id = ?
    LIMIT 1
  `);

  return Boolean(statement.get(id));
}

function isUsedInOrders(id) {
  const statement = db.prepare(`
    SELECT 1
    FROM order_items
    WHERE order_items.food_id = ?
    LIMIT 1
  `);

  return Boolean(statement.get(id));
}

function deleteById(id) {
  const statement = db.prepare(`
    DELETE FROM foods
    WHERE id = ?
  `);

  const result = statement.run(id);

  return result.changes > 0;
}

module.exports = {
  getAll,
  getById,
  getByFoodGroupId,
  create,
  update,
  setActive,
  isUsedInCombos,
  isUsedInOrders,
  deleteById,
};
