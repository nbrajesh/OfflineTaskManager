import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { getAllTasks, getUnsyncedTasks, purgeDeletedSynced, softDeleteTask, upsertTask } from '../db/sqlite';
import type { Task, TaskStatus } from '../types';
import { syncWithServer } from '../sync/syncManager';

export interface TasksState {
  items: Task[];
  loading: boolean;
  error?: string;
  isOnline: boolean;
  lastSyncAt?: number;
  conflicts: { id: string; resolvedTo: 'local' | 'server' }[];
}

const initialState: TasksState = {
  items: [],
  loading: false,
  isOnline: false,
  conflicts: [],
};

export const loadTasks = createAsyncThunk('tasks/load', async () => {
  const tasks = await getAllTasks();
  return tasks;
});

export const addTask = createAsyncThunk(
  'tasks/add',
  async ({ title, description }: { title: string; description: string }) => {
    const now = Date.now();
    const task: Task = {
      id: `${now}-${Math.random().toString(36).slice(2)}`,
      title,
      description,
      status: 'Pending',
      lastUpdated: now,
      isSynced: false,
      isDeleted: false,
    };
    await upsertTask(task);
    return task;
  },
);

export const updateTask = createAsyncThunk(
  'tasks/update',
  async ({ id, title, description }: { id: string; title: string; description: string }) => {
    const now = Date.now();
    const updated: Partial<Task> = {
      id,
      title,
      description,
      lastUpdated: now,
      isSynced: false,
    };
    await upsertTask(updated as Task);
    return updated;
  },
);

export const toggleComplete = createAsyncThunk(
  'tasks/toggleComplete',
  async ({ id, status }: { id: string; status: TaskStatus }) => {
    const now = Date.now();
    const updated: Partial<Task> = {
      id,
      status,
      lastUpdated: now,
      isSynced: false,
    };
    await upsertTask(updated as Task);
    return updated;
  },
);

export const deleteTask = createAsyncThunk('tasks/delete', async (id: string) => {
  const now = Date.now();
  await softDeleteTask(id, now);
  return { id, lastUpdated: now };
});

export const performSync = createAsyncThunk('tasks/sync', async () => {
  const unsynced = await getUnsyncedTasks();
  const res = await syncWithServer(unsynced);
  await purgeDeletedSynced();
  const items = await getAllTasks();
  return { items, res };
});

const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    setOnline(state, action: PayloadAction<boolean>) {
      state.isOnline = action.payload;
    },
    clearConflicts(state) {
      state.conflicts = [];
    },
  },
  extraReducers: builder => {
    builder
      .addCase(loadTasks.pending, state => {
        state.loading = true;
      })
      .addCase(loadTasks.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(loadTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(addTask.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(updateTask.fulfilled, (state, action) => {
        const idx = state.items.findIndex(t => t.id === action.payload.id);
        if (idx >= 0) {
          state.items[idx] = { ...state.items[idx], ...action.payload } as Task;
        }
      })
      .addCase(toggleComplete.fulfilled, (state, action) => {
        const idx = state.items.findIndex(t => t.id === action.payload.id);
        if (idx >= 0) {
          state.items[idx] = { ...state.items[idx], ...action.payload } as Task;
        }
      })
      .addCase(deleteTask.fulfilled, (state, action) => {
        const idx = state.items.findIndex(t => t.id === action.payload.id);
        if (idx >= 0) {
          state.items.splice(idx, 1);
        }
      })
      .addCase(performSync.fulfilled, (state, action) => {
        state.items = action.payload.items;
        state.lastSyncAt = Date.now();
        state.conflicts = action.payload.res.conflicts;
      });
  },
});

export const { setOnline, clearConflicts } = tasksSlice.actions;
export default tasksSlice.reducer;
