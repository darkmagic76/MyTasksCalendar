/**
 * Persistencia de tareas en el navegador.
 * Valida y normaliza lo que sale de localStorage para que una caché
 * corrupta nunca rompa la aplicación.
 */

import { readRaw, removeRaw, writeRaw } from '@infrastructure/storage/local-storage';
import type { Task, TaskStatus } from '../models';
import { isTaskStatus } from '../models';
import { createSeedTasks } from './seed';

const STORAGE_KEY = 'mytaskscalendar.tasks.v1';

function asNullableString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

function normalizeTask(raw: unknown): Task | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const candidate = raw as Record<string, unknown>;

  if (typeof candidate.id !== 'string' || candidate.id === '') return null;
  if (typeof candidate.title !== 'string' || candidate.title.trim() === '') return null;

  const status: TaskStatus = isTaskStatus(candidate.status) ? candidate.status : 'pending';

  return {
    id: candidate.id,
    title: candidate.title,
    description: asNullableString(candidate.description),
    date: asNullableString(candidate.date),
    time: asNullableString(candidate.time),
    status,
    createdAt:
      typeof candidate.createdAt === 'string' ? candidate.createdAt : new Date().toISOString(),
    updatedAt:
      typeof candidate.updatedAt === 'string' ? candidate.updatedAt : new Date().toISOString(),
  };
}

function parseTasks(raw: string): Task[] {
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) return [];
  return parsed
    .map(normalizeTask)
    .filter((task): task is Task => task !== null)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export const taskStorage = {
  /** Carga las tareas; en el primer arranque siembra datos de demostración. */
  load(): Task[] {
    const raw = readRaw(STORAGE_KEY);
    if (raw === null) return createSeedTasks();
    try {
      return parseTasks(raw);
    } catch (error) {
      console.warn('[task-storage] Datos corruptos, se inicia vacío', error);
      return [];
    }
  },

  save(tasks: Task[]): boolean {
    return writeRaw(STORAGE_KEY, JSON.stringify(tasks));
  },

  /** Sondeo rápido para saber si el navegador permite persistencia. */
  isAvailable(): boolean {
    const probeKey = `${STORAGE_KEY}.probe`;
    const ok = writeRaw(probeKey, '1');
    if (ok) removeRaw(probeKey);
    return ok;
  },
};
