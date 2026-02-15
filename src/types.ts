export type TaskStatus = 'Pending' | 'Completed';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  lastUpdated: number;
  isSynced: boolean;
  isDeleted?: boolean;
}

export interface SyncResult {
  syncedIds: string[];
  conflicts: { id: string; resolvedTo: 'local' | 'server' }[];
}
