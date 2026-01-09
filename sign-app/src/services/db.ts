import * as SQLite from 'expo-sqlite';

const DB_NAME = 'sign.db';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

const ensureDatabase = (): Promise<SQLite.SQLiteDatabase> => {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DB_NAME);
  }
  return dbPromise;
};

const runMigrations = async (db: SQLite.SQLiteDatabase): Promise<void> => {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS draws (
      id TEXT PRIMARY KEY NOT NULL,
      createdAt INTEGER NOT NULL,
      mode TEXT NOT NULL,
      cardIds TEXT NOT NULL,
      packIds TEXT NOT NULL,
      question TEXT,
      note TEXT,
      isDaily INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS favorites (
      id TEXT PRIMARY KEY NOT NULL,
      drawId TEXT NOT NULL,
      createdAt INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_draws_createdAt ON draws(createdAt DESC);
    CREATE INDEX IF NOT EXISTS idx_favorites_drawId ON favorites(drawId);
  `);
  try {
    await db.runAsync('ALTER TABLE draws ADD COLUMN cardText TEXT');
  } catch {
    // Column already exists.
  }
  await db.execAsync('CREATE INDEX IF NOT EXISTS idx_draws_cardText ON draws(cardText);');
};

export const initializeDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  const db = await ensureDatabase();
  await runMigrations(db);
  return db;
};

export const getDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  return initializeDatabase();
};
