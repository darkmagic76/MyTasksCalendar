import { describe, expect, it } from 'vitest';
import type { Task, TaskFilters } from '../models';
import { compareForTray, countByStatus, filterTasks, groupTasksByDate } from './task-query';

function makeTask(overrides: Partial<Task>): Task {
  return {
    id: overrides.id ?? Math.random().toString(36).slice(2),
    title: 'Tarea',
    description: null,
    date: null,
    time: null,
    status: 'pending',
    createdAt: '2026-01-01T10:00:00.000Z',
    updatedAt: '2026-01-01T10:00:00.000Z',
    ...overrides,
  };
}

const baseFilters: TaskFilters = { status: 'all', query: '' };

describe('filterTasks', () => {
  const tasks = [
    makeTask({ id: 'a', title: 'Informe financiero', status: 'pending' }),
    makeTask({ id: 'b', title: 'Reunión de equipo', status: 'in-progress' }),
    makeTask({ id: 'c', title: 'Deploy del backend', status: 'completed' }),
    makeTask({
      id: 'd',
      title: 'Pendiente de revisar diseño',
      description: 'wireframes',
      status: 'pending',
    }),
  ];

  it('filtra por estado', () => {
    const result = filterTasks(tasks, { ...baseFilters, status: 'pending' });
    expect(result.map((task) => task.id)).toEqual(['a', 'd']);
  });

  it('busca en título y descripción sin distinguir mayúsculas', () => {
    expect(filterTasks(tasks, { ...baseFilters, query: 'FINANCIERO' })).toHaveLength(1);
    expect(filterTasks(tasks, { ...baseFilters, query: 'wireframes' })).toHaveLength(1);
    expect(filterTasks(tasks, { ...baseFilters, query: 'no-existe' })).toHaveLength(0);
  });

  it('combina estado y texto', () => {
    const result = filterTasks(tasks, { status: 'pending', query: 'diseño' });
    expect(result.map((task) => task.id)).toEqual(['d']);
  });
});

describe('groupTasksByDate', () => {
  it('agrupa solo tareas con fecha y ordena por hora ascendente', () => {
    const tasks = [
      makeTask({ id: 'tarde', date: '2026-10-13', time: '16:00' }),
      makeTask({ id: 'sin-fecha', date: null }),
      makeTask({ id: 'allday', date: '2026-10-13', time: null }),
      makeTask({ id: 'manana', date: '2026-10-14', time: '09:00' }),
      makeTask({ id: 'temprano', date: '2026-10-13', time: '08:30' }),
    ];

    const groups = groupTasksByDate(tasks);
    expect(groups.has(null as unknown as string)).toBe(false);
    expect(groups.get('2026-10-13')?.map((task) => task.id)).toEqual([
      'allday', // todo el día primero
      'temprano',
      'tarde',
    ]);
    expect(groups.get('2026-10-14')?.map((task) => task.id)).toEqual(['manana']);
  });
});

describe('compareForTray (orden de la bandeja)', () => {
  it('ordena pendientes → en curso → completadas y luego por recencia', () => {
    const older = makeTask({
      id: 'older',
      status: 'pending',
      createdAt: '2026-01-01T00:00:00.000Z',
    });
    const newer = makeTask({
      id: 'newer',
      status: 'pending',
      createdAt: '2026-06-01T00:00:00.000Z',
    });
    const running = makeTask({ id: 'running', status: 'in-progress' });
    const done = makeTask({ id: 'done', status: 'completed' });

    const sorted = [done, running, older, newer].sort(compareForTray);
    expect(sorted.map((task) => task.id)).toEqual(['newer', 'older', 'running', 'done']);
  });
});

describe('countByStatus', () => {
  it('cuenta cada estado', () => {
    const counts = countByStatus([
      makeTask({ status: 'pending' }),
      makeTask({ status: 'pending' }),
      makeTask({ status: 'in-progress' }),
      makeTask({ status: 'completed' }),
    ]);
    expect(counts).toEqual({ pending: 2, 'in-progress': 1, completed: 1 });
  });
});
