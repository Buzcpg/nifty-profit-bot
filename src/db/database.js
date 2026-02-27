const fs = require('fs');
const os = require('os');
const path = require('path');
const Database = require('better-sqlite3');

const defaultDbPath = path.join(os.homedir(), '.openclaw', 'nifty-profit-bot.db');
const dbPath = process.env.DB_PATH || defaultDbPath;

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS profits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    username TEXT NOT NULL,
    currency TEXT NOT NULL,
    amount REAL NOT NULL,
    amount_usd REAL NOT NULL,
    collection TEXT NOT NULL,
    share INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

db.prepare("INSERT OR IGNORE INTO config (key, value) VALUES ('announce_channel', '')").run();

const insertProfitStmt = db.prepare(`
  INSERT INTO profits (user_id, username, currency, amount, amount_usd, collection, share)
  VALUES (@user_id, @username, @currency, @amount, @amount_usd, @collection, @share)
`);

const getConfigStmt = db.prepare('SELECT value FROM config WHERE key = ?');
const setConfigStmt = db.prepare(`
  INSERT INTO config (key, value)
  VALUES (?, ?)
  ON CONFLICT(key) DO UPDATE SET value = excluded.value
`);

const getUserStatsStmt = db.prepare(`
  SELECT
    COALESCE(SUM(amount_usd), 0) AS total_profit_usd,
    COUNT(*) AS trade_count,
    SUM(CASE WHEN amount_usd > 1 THEN 1 ELSE 0 END) AS wins,
    COALESCE(MAX(amount_usd), 0) AS best_trade_usd
  FROM profits
  WHERE user_id = ?
`);

const getLeaderboardStmt = db.prepare(`
  SELECT
    username,
    user_id,
    SUM(amount_usd) AS total_profit_usd,
    COUNT(*) AS trade_count
  FROM profits
  GROUP BY user_id, username
  ORDER BY total_profit_usd DESC
  LIMIT ?
`);

const getAllStatsStmt = db.prepare(`
  SELECT
    COALESCE(SUM(amount_usd), 0) AS total_profit_usd,
    COUNT(*) AS total_trades,
    COUNT(DISTINCT user_id) AS total_users
  FROM profits
`);

const getTopCurrencyStmt = db.prepare(`
  SELECT currency
  FROM profits
  GROUP BY currency
  ORDER BY COUNT(*) DESC, currency ASC
  LIMIT 1
`);

const getRecentProfitsStmt = db.prepare(`
  SELECT
    id,
    user_id,
    username,
    currency,
    amount,
    amount_usd,
    collection,
    share,
    created_at
  FROM profits
  ORDER BY datetime(created_at) DESC, id DESC
  LIMIT ?
`);

function insertProfit(profit) {
  insertProfitStmt.run(profit);
}

function getConfig(key) {
  const row = getConfigStmt.get(key);
  return row ? row.value : null;
}

function setConfig(key, value) {
  setConfigStmt.run(key, String(value));
}

function getUserStats(userId) {
  return getUserStatsStmt.get(userId);
}

function getLeaderboard(limit = 10) {
  return getLeaderboardStmt.all(limit);
}

function getAllStats() {
  const baseStats = getAllStatsStmt.get();
  const topCurrencyRow = getTopCurrencyStmt.get();

  return {
    ...baseStats,
    top_currency: topCurrencyRow ? topCurrencyRow.currency : null,
  };
}

function getRecentProfits(limit = 20) {
  return getRecentProfitsStmt.all(limit);
}

module.exports = {
  insertProfit,
  getConfig,
  setConfig,
  getUserStats,
  getLeaderboard,
  getAllStats,
  getRecentProfits,
};
