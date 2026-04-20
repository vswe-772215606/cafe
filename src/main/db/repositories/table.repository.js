const db = require("../index");

const SELECT_TABLES_SQL = `
  SELECT
    tables.id AS id,
    tables.number AS number,
    tables.created_at AS created_at,
    tables.updated_at AS updated_at
  FROM tables
`;

function getAll() {
  const statement = db.prepare(`
    ${SELECT_TABLES_SQL}
    ORDER BY tables.number ASC
  `);

  return statement.all();
}

function getById(id) {
  const statement = db.prepare(`
    ${SELECT_TABLES_SQL}
    WHERE tables.id = ?
  `);

  return statement.get(id);
}

function getByNumber(number) {
  const statement = db.prepare(`
    ${SELECT_TABLES_SQL}
    WHERE tables.number = ?
  `);

  return statement.get(number);
}

function create({ number }) {
  const now = new Date().toISOString();

  const statement = db.prepare(`
    INSERT INTO tables (number, created_at, updated_at)
    VALUES (?, ?, ?)
  `);

  const result = statement.run(number, now, now);

  return getById(result.lastInsertRowid);
}

function update(id, { number }) {
  const now = new Date().toISOString();

  const statement = db.prepare(`
    UPDATE tables
    SET number = ?, updated_at = ?
    WHERE id = ?
  `);

  const result = statement.run(number, now, id);

  if (result.changes === 0) {
    return undefined;
  }

  return getById(id);
}

function deleteById(id) {
  const statement = db.prepare(`
    DELETE FROM tables
    WHERE id = ?
  `);

  const result = statement.run(id);

  return result.changes > 0;
}

module.exports = {
  getAll,
  getById,
  getByNumber,
  create,
  update,
  deleteById,
};
