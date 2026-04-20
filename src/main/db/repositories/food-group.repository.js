const db = require('../index');

function getAll() {
  const statement = db.prepare(`
    SELECT id, name, created_at, updated_at
    FROM food_groups
    ORDER BY name ASC
  `);

  return statement.all();
}

function getById(id) {
  const statement = db.prepare(`
    SELECT id, name, created_at, updated_at
    FROM food_groups
    WHERE id = ?
  `);

  return statement.get(id);
}

function create({ name }) {
  const now = new Date().toISOString();

  const statement = db.prepare(`
    INSERT INTO food_groups (name, created_at, updated_at)
    VALUES (?, ?, ?)
  `);

  const result = statement.run(name, now, now);

  return getById(result.lastInsertRowid);
}

function update(id, { name }) {
  const now = new Date().toISOString();

  const statement = db.prepare(`
    UPDATE food_groups
    SET name = ?, updated_at = ?
    WHERE id = ?
  `);

  const result = statement.run(name, now, id);

  if (result.changes === 0) {
    return undefined;
  }

  return getById(id);
}

function deleteById(id) {
  const statement = db.prepare(`
    DELETE FROM food_groups
    WHERE id = ?
  `);

  const result = statement.run(id);

  return result.changes > 0;
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  deleteById,
};
