/**
 * Funciones puras de filtrado, agrupación y ordenación de tareas.
 * Separadas de los componentes para que sean testeadas con Vitest.
 */

import type { Task, TaskFilters, TaskStatus } from '../models';
import { TASK_STATUSES } from '../models';

export function matchesFilters(task: Task, filters: TaskFilters): boolean {
  if (filters.status !== 'all' && task.status !== filters.status) {
    return false;
  }
  const query = filters.query.trim().toLowerCase();
  if (query === '') return true;
  return (
    task.title.toLowerCase().includes(query) ||
    (task.description ?? '').toLowerCase().includes(query)
  );
}

export function filterTasks(tasks: Task[], filters: TaskFilters): Task[] {
  return tasks.filter((task) => matchesFilters(task, filters));
}

/**
 * Orden de un día: primero las tareas de todo el día, después por hora
 * ascendente y, en caso de empate, por orden de creación.
 */
export function compareByTime(a: Task, b: Task): number {
  if ((a.time === null) !== (b.time === null)) {
    return a.time === null ? -1 : 1;
  }
  if (a.time !== null && b.time !== null && a.time !== b.time) {
    return a.time < b.time ? -1 : 1;
  }
  return a.createdAt.localeCompare(b.createdAt);
}

/** Orden de la bandeja: primero lo que falta por hacer, luego lo más reciente. */
export function compareForTray(a: Task, b: Task): number {
  const statusDiff = TASK_STATUSES.indexOf(a.status) - TASK_STATUSES.indexOf(b.status);
  if (statusDiff !== 0) return statusDiff;
  return b.createdAt.localeCompare(a.createdAt);
}

/** Agrupa por fecha (solo tareas con fecha) y devuelve cada día ordenado. */
export function groupTasksByDate(tasks: Task[]): Map<string, Task[]> {
  const groups = new Map<string, Task[]>();
  for (const task of tasks) {
    if (task.date === null) continue;
    const bucket = groups.get(task.date);
    if (bucket) bucket.push(task);
    else groups.set(task.date, [task]);
  }
  for (const bucket of groups.values()) {
    bucket.sort(compareByTime);
  }
  return groups;
}

export function countByStatus(tasks: Task[]): Record<TaskStatus, number> {
  const counts: Record<TaskStatus, number> = { pending: 0, 'in-progress': 0, completed: 0 };
  for (const task of tasks) {
    counts[task.status] += 1;
  }
  return counts;
}
