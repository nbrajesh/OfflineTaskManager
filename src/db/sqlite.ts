import { open, type QuickSQLiteConnection } from 'react-native-quick-sqlite';
import type { Task } from '../types';

const DB_NAME = 'tasks.db';

let dbInstance: QuickSQLiteConnection | null = null;

export async function getDB(): Promise<QuickSQLiteConnection> {
  if (dbInstance) return dbInstance;
  dbInstance = open({ name: DB_NAME, location: 'default' });
  dbInstance.execute(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT NOT NULL,
      lastUpdated INTEGER NOT NULL,
      isSynced INTEGER NOT NULL,
      isDeleted INTEGER NOT NULL
    );
  `);
  return dbInstance;
}

export async function getAllTasks(): Promise<Task[]> {
  const db = await getDB();
  const res = db.execute('SELECT * FROM tasks WHERE isDeleted = 0 ORDER BY lastUpdated DESC;');
  const items: Task[] = [];
  const len = res.rows ? res.rows.length : 0;
  for (let i = 0; i < len; i++) {
    const r = res.rows!.item(i);
    items.push(mapRowToTask(r));
  }
  return items;
}

function mapRowToTask(r: any): Task {
  return {
    id: String(r.id),
    title: String(r.title),
    description: String(r.description),
    status: r.status === 'Completed' ? 'Completed' : 'Pending',
    lastUpdated: Number(r.lastUpdated),
    isSynced: Number(r.isSynced) === 1,
    isDeleted: Number(r.isDeleted) === 1,
  };
}

export async function upsertTask(t: Partial<Task> & { id: string }): Promise<void> {
  const db = await getDB();
  const existingRes = db.execute('SELECT * FROM tasks WHERE id = ? LIMIT 1;', [t.id]);
  const current: Task | null =
    existingRes.rows && existingRes.rows.length > 0 ? mapRowToTask(existingRes.rows.item(0)) : null;
  const merged: Task = {
    id: t.id,
    title: t.title ?? current?.title ?? '',
    description: t.description ?? current?.description ?? '',
    status: t.status ?? current?.status ?? 'Pending',
    lastUpdated: t.lastUpdated ?? current?.lastUpdated ?? Date.now(),
    isSynced: t.isSynced ?? false,
    isDeleted: t.isDeleted ?? current?.isDeleted ?? false,
  };
  db.execute(
    `INSERT OR REPLACE INTO tasks (id, title, description, status, lastUpdated, isSynced, isDeleted)
     VALUES (?, ?, ?, ?, ?, ?, ?);`,
    [
      merged.id,
      merged.title,
      merged.description,
      merged.status,
      merged.lastUpdated,
      merged.isSynced ? 1 : 0,
      merged.isDeleted ? 1 : 0,
    ],
  );
}

export async function softDeleteTask(id: string, lastUpdated: number): Promise<void> {
  const db = await getDB();
  db.execute(`UPDATE tasks SET isDeleted = 1, isSynced = 0, lastUpdated = ? WHERE id = ?;`, [
    lastUpdated,
    id,
  ]);
}

export async function markSynced(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const db = await getDB();
  const placeholders = ids.map(() => '?').join(',');
  db.execute(`UPDATE tasks SET isSynced = 1 WHERE id IN (${placeholders});`, ids);
}

export async function getUnsyncedTasks(): Promise<Task[]> {
  const db = await getDB();
  const res = db.execute('SELECT * FROM tasks WHERE isSynced = 0;');
  const items: Task[] = [];
  const len = res.rows ? res.rows.length : 0;
  for (let i = 0; i < len; i++) {
    const r = res.rows!.item(i);
    items.push(mapRowToTask(r));
  }
  return items;
}

export async function purgeDeletedSynced(): Promise<void> {
  const db = await getDB();
  db.execute('DELETE FROM tasks WHERE isDeleted = 1 AND isSynced = 1;');
}
