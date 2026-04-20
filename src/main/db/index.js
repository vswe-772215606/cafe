const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const Database = require('better-sqlite3');

const userDataPath = app.getPath('userData');
const dataDir = path.join(userDataPath, 'data');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'cafe.db');
const schemaPath = path.join(__dirname, 'schema.sql');

const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const schemaSql = fs.readFileSync(schemaPath, 'utf8');
db.exec(schemaSql);

module.exports = db;
