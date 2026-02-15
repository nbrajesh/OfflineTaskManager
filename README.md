# Offline-First Task Manager

Offline-first React Native app with SQLite local storage and simulated server sync. Fully functional offline; local database is the primary source of truth.

## Setup

- Prerequisites: complete React Native environment setup for iOS/Android.
- Install JS deps:
  ```sh
  npm install
  ```
- iOS CocoaPods:
  ```sh
  cd ios
  bundle install
  bundle exec pod install
  cd ..
  ```
- Start Metro:
  ```sh
  npm start
  ```
- Run app:
  ```sh
  npm run ios
  # or
  npm run android
  ```

## Features

- Task fields: id, title, description, status (Pending/Completed), lastUpdated, isSynced.
- Add, edit, delete, mark complete/incomplete.
- Works offline; all operations persist to SQLite immediately.
- Auto-sync of unsynced changes when connectivity is restored.
- Conflict reporting banner shows how each conflict was resolved.

## Architecture

- UI: functional components with Hooks under `src/components` ([TaskList.tsx](file:///Users/mac/Documents/OfflineTaskManager/src/components/TaskList.tsx), [TaskForm.tsx](file:///Users/mac/Documents/OfflineTaskManager/src/components/TaskForm.tsx), [TaskItem.tsx](file:///Users/mac/Documents/OfflineTaskManager/src/components/TaskItem.tsx)).
- State: Redux Toolkit slice `tasks` with thunks for CRUD and sync ([tasksSlice.ts](file:///Users/mac/Documents/OfflineTaskManager/src/store/tasksSlice.ts)).
- Storage: SQLite via `react-native-sqlite-storage`; table `tasks` with columns:
  - id TEXT PRIMARY KEY
  - title TEXT
  - description TEXT
  - status TEXT
  - lastUpdated INTEGER
  - isSynced INTEGER
  - isDeleted INTEGER (tombstone for deletions)
  See [sqlite.ts](file:///Users/mac/Documents/OfflineTaskManager/src/db/sqlite.ts).
- Connectivity: NetInfo subscription toggles `isOnline` and triggers sync.
- Simulated server: AsyncStorage-backed APIs emulating GET/POST/PUT/DELETE under [api.ts](file:///Users/mac/Documents/OfflineTaskManager/src/sync/api.ts).
- Sync manager: Orchestrates two-way sync, updates local DB, marks synced items, pulls server-only tasks ([syncManager.ts](file:///Users/mac/Documents/OfflineTaskManager/src/sync/syncManager.ts)).
- App entry: Redux Provider + SafeArea with [App.tsx](file:///Users/mac/Documents/OfflineTaskManager/App.tsx).

## Sync Strategy

- Local DB is the source of truth; all writes go to SQLite first and mark `isSynced=false`.
- On connectivity:
  1. Read unsynced local items.
  2. For each unsynced task:
     - If absent on server: create or delete remotely depending on `isDeleted`.
     - If present on server: resolve using `lastUpdated`.
  3. Pull server-only tasks into local DB.
  4. Mark synced items with `isSynced=true`. Purge rows where `isDeleted=1 AND isSynced=1`.

### Conflicts (User-Friendly)

- What is a “conflict”? It simply means your phone’s version and the cloud’s version were different when you came online. The app chose the newer one so both match.
- When you edit a task offline, your phone keeps the newer version. After you reconnect, if the cloud is older, your offline changes are saved to the cloud. That is shown as “LOCAL” in the banner — it’s a success message, not an error.
- If the cloud is newer (for example, someone else changed the task while you were offline), the app updates your phone with the cloud’s version. That appears as “SERVER”.
- Ties are rare; if timestamps match exactly, the app prefers the cloud version.
- You can dismiss the banner anytime. Your list already shows the final resolved version.

Behind the scenes, the app compares a “last updated time” on each task to decide which copy is newer. Deletes are handled safely using a “tombstone” marker; once a delete is confirmed synced, the record is removed from the local database.

## Folder Structure

- src/
  - components/ TaskList, TaskForm, TaskItem
  - db/ sqlite.ts
  - store/ index.ts, tasksSlice.ts
  - sync/ api.ts, syncManager.ts
  - types.ts

## Production Readiness

- Autolinked native deps; iOS pods installed.
- Deterministic conflict resolution and tombstones for safe deletes.
- Minimal UI indicating unsynced state and conflict outcomes.
- Clean Redux architecture with typed hooks, isolated storage layer.

## Simulated APIs

- GET /tasks → `apiGetTasks()`
- POST /tasks → `apiCreateTask(task)`
- PUT /tasks/:id → `apiUpdateTask(task)`
- DELETE /tasks/:id → `apiDeleteTask(id)`
These wrap AsyncStorage to mimic a remote service and latency.

## Testing and Lint

- Run tests: `npm test` (default RN Jest setup).
- Lint: `npm run lint`.

## Git Repository


# OfflineTaskManager
