const db = require('../index');

function get(key) {
  const statement = db.prepare(`
    SELECT key, value, updated_at
    FROM settings
    WHERE key = ?
  `);

  return statement.get(key);
}

function getValue(key) {
  const row = get(key);
  return row ? row.value : null;
}

function set(key, value) {
  const now = new Date().toISOString();

  const statement = db.prepare(`
    INSERT INTO settings (key, value, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET
      value = excluded.value,
      updated_at = excluded.updated_at
  `);

  statement.run(key, value, now);

  return get(key);
}

module.exports = {
  get,
  getValue,
  set,
};
