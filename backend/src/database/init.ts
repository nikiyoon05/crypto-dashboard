import sqlite3 from 'sqlite3';
import path from 'path';
import { promisify } from 'util';

let db: sqlite3.Database;

export function getDatabase(): sqlite3.Database {
  if (!db) {
    const dbPath = path.join(process.cwd(), 'data', 'crypto-tracker.db');
    db = new sqlite3.Database(dbPath);
    db.run('PRAGMA journal_mode = WAL');
  }
  return db;
}

export async function initializeDatabase(): Promise<void> {
  const database = getDatabase();
  const run = promisify(database.run.bind(database));
  
  // Create tables
  await run(`
    CREATE TABLE IF NOT EXISTS watchlist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      crypto_id TEXT NOT NULL UNIQUE,
      symbol TEXT NOT NULL,
      name TEXT NOT NULL,
      added_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS trending_cryptos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      crypto_id TEXT NOT NULL UNIQUE,
      symbol TEXT NOT NULL,
      name TEXT NOT NULL,
      current_price REAL,
      price_change_24h REAL,
      price_change_percentage_24h REAL,
      market_cap REAL,
      market_cap_rank INTEGER,
      image TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS price_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      crypto_id TEXT NOT NULL,
      price REAL NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create indexes
  await run('CREATE INDEX IF NOT EXISTS idx_watchlist_crypto_id ON watchlist(crypto_id)');
  await run('CREATE INDEX IF NOT EXISTS idx_trending_crypto_id ON trending_cryptos(crypto_id)');
  await run('CREATE INDEX IF NOT EXISTS idx_price_history_crypto_id ON price_history(crypto_id)');
  await run('CREATE INDEX IF NOT EXISTS idx_price_history_timestamp ON price_history(timestamp)');

  console.log('✅ Database initialized successfully');
}

export function closeDatabase(): void {
  if (db) {
    db.close();
  }
} 