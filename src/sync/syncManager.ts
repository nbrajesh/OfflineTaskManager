import { apiCreateTask, apiDeleteTask, apiGetTasks, apiUpdateTask } from './api';
import type { SyncResult, Task } from '../types';
import { markSynced, upsertTask } from '../db/sqlite';

export async function syncWithServer(unsyncedLocal: Task[]): Promise<SyncResult> {
  const serverTasks = await apiGetTasks();
  const serverMap = new Map<string, Task>(serverTasks.map(t => [t.id, t]));
  const syncedIds: string[] = [];
  const conflicts: { id: string; resolvedTo: 'local' | 'server' }[] = [];

  // Push local changes to server or resolve conflicts
  for (const local of unsyncedLocal) {
    const server = serverMap.get(local.id);
    if (!server) {
      // New local item or deleted tombstone
      if (local.isDeleted) {
        // nothing to push; ensure server is also deleted
        await apiDeleteTask(local.id);
        syncedIds.push(local.id);
        continue;
      }
      await apiCreateTask({ ...local, isSynced: true });
      syncedIds.push(local.id);
    } else {
      // Both have updates; resolve by lastUpdated
      if (local.lastUpdated > server.lastUpdated) {
        if (local.isDeleted) {
          await apiDeleteTask(local.id);
        } else {
          await apiUpdateTask({ ...local, isSynced: true });
        }
        syncedIds.push(local.id);
        conflicts.push({ id: local.id, resolvedTo: 'local' });
      } else if (local.lastUpdated < server.lastUpdated) {
        // Server wins; update local copy
        await upsertTask({ ...server, isSynced: true });
        syncedIds.push(local.id);
        conflicts.push({ id: local.id, resolvedTo: 'server' });
      } else {
        // Same timestamp; prefer server
        await upsertTask({ ...server, isSynced: true });
        syncedIds.push(local.id);
        conflicts.push({ id: local.id, resolvedTo: 'server' });
      }
    }
  }

  // Pull server-only tasks into local if missing
  for (const server of serverTasks) {
    if (server.isDeleted) continue;
    const hasLocal = unsyncedLocal.find(t => t.id === server.id);
    if (!hasLocal) {
      await upsertTask({ ...server, isSynced: true });
    }
  }

  if (syncedIds.length > 0) {
    await markSynced(syncedIds);
  }

  return { syncedIds, conflicts };
}
