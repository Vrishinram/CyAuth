const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'cyauth.db'));

// Initialize tables
db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        two_factor_secret TEXT,
        is_two_factor_enabled INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

module.exports = db;
