import { Database } from "bun:sqlite";
import path from "node:path";
import fs from "node:fs";

// Resolve from this file so dev/prod work regardless of current working directory.
const dataDir = path.resolve(import.meta.dir, "..", "data");
fs.mkdirSync(dataDir, { recursive: true });
fs.mkdirSync(path.join(dataDir, "uploads"), { recursive: true });

const dbPath = path.join(dataDir, "wixxie-home.db");
export const db = new Database(dbPath, { create: true });

db.exec("PRAGMA journal_mode = WAL;");

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL,
      is_admin INTEGER NOT NULL DEFAULT 0,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS user_settings (
      user_id INTEGER PRIMARY KEY,
      theme TEXT NOT NULL DEFAULT 'system',
      search_engine TEXT NOT NULL DEFAULT 'duckduckgo',
      site_title TEXT NOT NULL DEFAULT 'Wixxie Home',
      favicon_path TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      icon TEXT,
      open_in_new_tab INTEGER NOT NULL DEFAULT 1,
      app_type TEXT,
      api_config TEXT,
      is_pinned INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0,
      pinned_sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      UNIQUE(user_id, name),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS service_tags (
      service_id INTEGER NOT NULL,
      tag_id INTEGER NOT NULL,
      PRIMARY KEY (service_id, tag_id),
      FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS cached_stats (
      service_id INTEGER PRIMARY KEY,
      stats_json TEXT NOT NULL,
      last_updated TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
    );
  `);

  const userColumns = db.query(`PRAGMA table_info(users)`).all() as Array<{ name: string }>;
  const hasAdminColumn = userColumns.some((column) => column.name === "is_admin");
  if (!hasAdminColumn) {
    db.exec(`ALTER TABLE users ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0`);
  }

  const adminCountRow = db
    .prepare(`SELECT COUNT(*) as count FROM users WHERE is_admin = 1`)
    .get() as { count: number };
  if (adminCountRow.count === 0) {
    db.exec(`
      UPDATE users
      SET is_admin = 1
      WHERE id = (SELECT id FROM users ORDER BY id ASC LIMIT 1)
    `);
  }
}

export type DbServiceRow = {
  id: number;
  user_id: number;
  name: string;
  url: string;
  icon: string | null;
  open_in_new_tab: number;
  app_type: string | null;
  api_config: string | null;
  is_pinned: number;
  sort_order: number;
  pinned_sort_order: number;
  created_at: string;
  updated_at: string;
};

export function ensureUserSettings(userId: number) {
  const stmt = db.prepare(
    `INSERT INTO user_settings (user_id) VALUES (?) ON CONFLICT(user_id) DO NOTHING`,
  );
  stmt.run(userId);
}
