import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Task } from '../types';

const SERVER_KEY = 'server_tasks_v1';

async function readServerTasks(): Promise<Task[]> {
  const raw = await AsyncStorage.getItem(SERVER_KEY);
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw) as Task[];
    return arr;
  } catch {
    return [];
  }
}

async function writeServerTasks(tasks: Task[]): Promise<void> {
  await AsyncStorage.setItem(SERVER_KEY, JSON.stringify(tasks));
}

export async function apiGetTasks(): Promise<Task[]> {
  await delay(300);
  return readServerTasks();
}

export async function apiCreateTask(task: Task): Promise<void> {
  await delay(300);
  const tasks = await readServerTasks();
  const idx = tasks.findIndex(t => t.id === task.id);
  if (idx >= 0) {
    tasks[idx] = task;
  } else {
    tasks.unshift(task);
  }
  await writeServerTasks(tasks);
}

export async function apiUpdateTask(task: Task): Promise<void> {
  await delay(300);
  const tasks = await readServerTasks();
  const idx = tasks.findIndex(t => t.id === task.id);
  if (idx >= 0) {
    tasks[idx] = task;
  } else {
    tasks.unshift(task);
  }
  await writeServerTasks(tasks);
}

export async function apiDeleteTask(id: string): Promise<void> {
  await delay(300);
  const tasks = await readServerTasks();
  const idx = tasks.findIndex(t => t.id === id);
  if (idx >= 0) {
    tasks.splice(idx, 1);
    await writeServerTasks(tasks);
  }
}

function delay(ms: number) {
  return new Promise<void>(resolve => setTimeout(() => resolve(), ms));
}
