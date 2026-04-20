const db = require('../index');

const SELECT_COMBOS_SQL = `
  SELECT
    combos.id AS id,
    combos.name AS name,
    combos.price AS price,
    combos.is_active AS is_active,
    combos.created_at AS created_at,
    combos.updated_at AS updated_at
  FROM combos
`;

function getAll() {
  const statement = db.prepare(`
    ${SELECT_COMBOS_SQL}
    ORDER BY combos.name ASC
  `);

  return statement.all();
}

function getById(id) {
  const statement = db.prepare(`
    ${SELECT_COMBOS_SQL}
    WHERE combos.id = ?
  `);

  return statement.get(id);
}

function getByName(name) {
  const statement = db.prepare(`
    ${SELECT_COMBOS_SQL}
    WHERE combos.name = ?
  `);

  return statement.get(name);
}

function getItemsByComboId(comboId) {
  const statement = db.prepare(`
    SELECT
      combo_items.id AS id,
      combo_items.combo_id AS combo_id,
      combo_items.food_id AS food_id,
      combo_items.quantity AS quantity,
      combo_items.created_at AS created_at,
      foods.name AS food_name,
      foods.price AS food_price,
      foods.is_active AS food_is_active,
      foods.food_group_id AS food_group_id
    FROM combo_items
    INNER JOIN foods ON foods.id = combo_items.food_id
    WHERE combo_items.combo_id = ?
    ORDER BY foods.name ASC
  `);

  return statement.all(comboId);
}

function getByIdWithItems(id) {
  const combo = getById(id);

  if (!combo) {
    return undefined;
  }

  return {
    ...combo,
    items: getItemsByComboId(id),
  };
}

function create({ name, price, isActive, items }) {
  const now = new Date().toISOString();
  const activeValue = isActive ? 1 : 0;

  const insertComboStatement = db.prepare(`
    INSERT INTO combos (name, price, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  const insertComboItemStatement = db.prepare(`
    INSERT INTO combo_items (combo_id, food_id, quantity, created_at)
    VALUES (?, ?, ?, ?)
  `);

  const transaction = db.transaction(() => {
    const comboResult = insertComboStatement.run(name, price, activeValue, now, now);
    const comboId = comboResult.lastInsertRowid;

    for (const item of items) {
      insertComboItemStatement.run(comboId, item.foodId, item.quantity, now);
    }

    return comboId;
  });

  const comboId = transaction();

  return getByIdWithItems(comboId);
}

function update(id, { name, price, isActive, items }) {
  const now = new Date().toISOString();
  const activeValue = isActive ? 1 : 0;

  const updateComboStatement = db.prepare(`
    UPDATE combos
    SET name = ?, price = ?, is_active = ?, updated_at = ?
    WHERE id = ?
  `);

  const deleteComboItemsStatement = db.prepare(`
    DELETE FROM combo_items
    WHERE combo_id = ?
  `);

  const insertComboItemStatement = db.prepare(`
    INSERT INTO combo_items (combo_id, food_id, quantity, created_at)
    VALUES (?, ?, ?, ?)
  `);

  const transaction = db.transaction(() => {
    const updateResult = updateComboStatement.run(name, price, activeValue, now, id);

    if (updateResult.changes === 0) {
      return undefined;
    }

    deleteComboItemsStatement.run(id);

    for (const item of items) {
      insertComboItemStatement.run(id, item.foodId, item.quantity, now);
    }

    return getByIdWithItems(id);
  });

  return transaction();
}

function setActive(id, isActive) {
  const now = new Date().toISOString();
  const activeValue = isActive ? 1 : 0;

  const statement = db.prepare(`
    UPDATE combos
    SET is_active = ?, updated_at = ?
    WHERE id = ?
  `);

  const result = statement.run(activeValue, now, id);

  if (result.changes === 0) {
    return undefined;
  }

  return getById(id);
}

module.exports = {
  getAll,
  getById,
  getByName,
  getItemsByComboId,
  getByIdWithItems,
  create,
  update,
  setActive,
};
