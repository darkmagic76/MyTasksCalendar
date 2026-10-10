/**
 * Modelos del feature task-scheduling.
 *
 * Scope Rule: estas definiciones solo las consume este feature, por lo que
 * viven aquí y no en shared/. Si una segunda feature necesita `Task`,
 * se extraerá a `src/shared/models`.
 */

export type TaskStatus = 'pending' | 'in-progress' | 'completed';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  /** Fecha en formato ISO corto `YYYY-MM-DD`, o null si aún no tiene fecha. */
  date: string | null;
  /** Hora `HH:MM` (24h), o null si es una tarea de todo el día. */
  time: string | null;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TaskInput {
  title: string;
  description?: string | null;
  date?: string | null;
  time?: string | null;
  status?: TaskStatus;
}

export type StatusFilter = 'all' | TaskStatus;

export interface TaskFilters {
  status: StatusFilter;
  query: string;
}

export const TASK_STATUSES: readonly TaskStatus[] = [
  'pending',
  'in-progress',
  'completed',
] as const;

export interface StatusMeta {
  label: string;
  color: string;
  /** Fondo suave derivado del color, para chips y segmentos. */
  soft: string;
}

export const STATUS_META: Record<TaskStatus, StatusMeta> = {
  pending: { label: 'Pendiente', color: '#f59e0b', soft: 'rgba(245, 158, 11, 0.14)' },
  'in-progress': { label: 'En curso', color: '#3b82f6', soft: 'rgba(59, 130, 246, 0.14)' },
  completed: { label: 'Completada', color: '#10b981', soft: 'rgba(16, 185, 129, 0.16)' },
};

/** Etiquetas en plural para los filtros. */
export const STATUS_FILTER_LABELS: Record<StatusFilter, string> = {
  all: 'Todas',
  pending: 'Pendientes',
  'in-progress': 'En curso',
  completed: 'Completadas',
};

export function isTaskStatus(value: unknown): value is TaskStatus {
  return value === 'pending' || value === 'in-progress' || value === 'completed';
}
