const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');
const os = require('os');

const DATA_DIR = process.env.DATA_DIR || path.join(os.homedir(), '.openclaw', 'nifty-profit-bot');
const PROFITS_FILE = path.join(DATA_DIR, 'profits.csv');
const CONFIG_FILE = path.join(DATA_DIR, 'config.csv');

const PROFITS_HEADERS = ['id','user_id','username','currency','amount','amount_usd','collection','share','created_at'];
const CONFIG_HEADERS = ['key','value'];

function initDB() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(PROFITS_FILE))
    fs.writeFileSync(PROFITS_FILE, stringify([], { header: true, columns: PROFITS_HEADERS }));
  if (!fs.existsSync(CONFIG_FILE))
    fs.writeFileSync(CONFIG_FILE, stringify([{ key: 'announce_channel', value: '' }], { header: true, columns: CONFIG_HEADERS }));
}

function readProfits() {
  const content = fs.readFileSync(PROFITS_FILE, 'utf8');
  if (!content.trim()) return [];
  return parse(content, { columns: true, skip_empty_lines: true });
}

function writeProfits(rows) {
  fs.writeFileSync(PROFITS_FILE, stringify(rows, { header: true, columns: PROFITS_HEADERS }));
}

function readConfig() {
  const content = fs.readFileSync(CONFIG_FILE, 'utf8');
  if (!content.trim()) return [];
  return parse(content, { columns: true, skip_empty_lines: true });
}

function writeConfig(rows) {
  fs.writeFileSync(CONFIG_FILE, stringify(rows, { header: true, columns: CONFIG_HEADERS }));
}

function insertProfit({ user_id, username, currency, amount, amount_usd, collection, share }) {
  const rows = readProfits();
  const maxId = rows.reduce((max, r) => Math.max(max, parseInt(r.id) || 0), 0);
  rows.push({ id: maxId + 1, user_id, username, currency, amount, amount_usd, collection, share: share ? 1 : 0, created_at: new Date().toISOString() });
  writeProfits(rows);
}

function getConfig(key) {
  const row = readConfig().find(r => r.key === key);
  return row ? row.value : null;
}

function setConfig(key, value) {
  const rows = readConfig();
  const idx = rows.findIndex(r => r.key === key);
  if (idx >= 0) rows[idx].value = value; else rows.push({ key, value });
  writeConfig(rows);
}

function getUserStats(userId) {
  const rows = readProfits().filter(r => r.user_id === userId);
  return {
    total_profit_usd: rows.reduce((s, r) => s + parseFloat(r.amount_usd), 0),
    trade_count: rows.length,
    wins: rows.filter(r => parseFloat(r.amount_usd) > 1).length,
    best_trade_usd: rows.reduce((m, r) => Math.max(m, parseFloat(r.amount_usd)), 0)
  };
}

function getLeaderboard(limit = 10) {
  const byUser = {};
  for (const r of readProfits()) {
    if (!byUser[r.user_id]) byUser[r.user_id] = { username: r.username, user_id: r.user_id, total_profit_usd: 0, trade_count: 0 };
    byUser[r.user_id].total_profit_usd += parseFloat(r.amount_usd);
    byUser[r.user_id].trade_count++;
  }
  return Object.values(byUser).sort((a, b) => b.total_profit_usd - a.total_profit_usd).slice(0, limit);
}

function getAllStats() {
  const rows = readProfits();
  const currencyCount = {};
  for (const r of rows) currencyCount[r.currency] = (currencyCount[r.currency] || 0) + 1;
  return {
    total_profit_usd: rows.reduce((s, r) => s + parseFloat(r.amount_usd), 0),
    total_trades: rows.length,
    total_users: new Set(rows.map(r => r.user_id)).size,
    top_currency: Object.entries(currencyCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'USD'
  };
}

function getRecentProfits(limit = 20) {
  return readProfits().slice(-limit).reverse();
}

initDB();

module.exports = { insertProfit, getConfig, setConfig, getUserStats, getLeaderboard, getAllStats, getRecentProfits };
