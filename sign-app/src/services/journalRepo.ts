import { getDatabase } from '@/src/services/db';

type DrawInput = {
  id: string;
  createdAt: number;
  mode: string;
  cardIds: string[];
  packIds: string[];
  question?: string | null;
  note?: string | null;
  isDaily: boolean;
};

export type DrawRecord = DrawInput;

type DrawRow = {
  id: string;
  createdAt: number;
  mode: string;
  cardIds: string;
  packIds: string;
  question: string | null;
  note: string | null;
  isDaily: number;
};

const serializeArray = (value: string[]): string => JSON.stringify(value);
const parseArray = (value: string): string[] => {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const mapRowToDraw = (row: DrawRow): DrawRecord => ({
  id: row.id,
  createdAt: row.createdAt,
  mode: row.mode,
  cardIds: parseArray(row.cardIds),
  packIds: parseArray(row.packIds),
  question: row.question ?? null,
  note: row.note ?? null,
  isDaily: Boolean(row.isDaily),
});

const generateId = (): string => {
  return `fav_${Date.now()}_${Math.random().toString(16).slice(2)}`;
};

type ListDrawsOptions = {
  limit?: number;
  offset?: number;
  searchText?: string;
};

export const addDraw = async (draw: DrawInput): Promise<void> => {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO draws (id, createdAt, mode, cardIds, packIds, question, note, isDaily)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      draw.id,
      draw.createdAt,
      draw.mode,
      serializeArray(draw.cardIds),
      serializeArray(draw.packIds),
      draw.question ?? null,
      draw.note ?? null,
      draw.isDaily ? 1 : 0,
    ]
  );
};

export const listDraws = async (options: ListDrawsOptions = {}): Promise<DrawRecord[]> => {
  const db = await getDatabase();
  const limit = options.limit ?? 50;
  const offset = options.offset ?? 0;
  const searchText = options.searchText?.trim();

  if (searchText) {
    const rows = await db.getAllAsync<DrawRow>(
      `SELECT * FROM draws
       WHERE question LIKE ? OR note LIKE ?
       ORDER BY createdAt DESC
       LIMIT ? OFFSET ?`,
      [`%${searchText}%`, `%${searchText}%`, limit, offset]
    );
    return rows.map(mapRowToDraw);
  }

  const rows = await db.getAllAsync<DrawRow>(
    `SELECT * FROM draws
     ORDER BY createdAt DESC
     LIMIT ? OFFSET ?`,
    [limit, offset]
  );
  return rows.map(mapRowToDraw);
};

export const getDraw = async (id: string): Promise<DrawRecord | null> => {
  const db = await getDatabase();
  const row = await db.getFirstAsync<DrawRow>(`SELECT * FROM draws WHERE id = ?`, [id]);
  return row ? mapRowToDraw(row) : null;
};

export const updateDrawNote = async (id: string, note: string | null): Promise<void> => {
  const db = await getDatabase();
  await db.runAsync(`UPDATE draws SET note = ? WHERE id = ?`, [note, id]);
};

export const toggleFavorite = async (drawId: string): Promise<boolean> => {
  const db = await getDatabase();
  const existing = await db.getFirstAsync<{ id: string }>(
    `SELECT id FROM favorites WHERE drawId = ?`,
    [drawId]
  );
  if (existing?.id) {
    await db.runAsync(`DELETE FROM favorites WHERE drawId = ?`, [drawId]);
    return false;
  }

  await db.runAsync(
    `INSERT INTO favorites (id, drawId, createdAt) VALUES (?, ?, ?)`,
    [generateId(), drawId, Date.now()]
  );
  return true;
};

export const listFavorites = async (): Promise<DrawRecord[]> => {
  const db = await getDatabase();
  const rows = await db.getAllAsync<DrawRow>(
    `SELECT draws.* FROM draws
     INNER JOIN favorites ON favorites.drawId = draws.id
     ORDER BY favorites.createdAt DESC`
  );
  return rows.map(mapRowToDraw);
};
