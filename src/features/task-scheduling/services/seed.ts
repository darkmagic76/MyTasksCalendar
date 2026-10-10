/**
 * Semilla de tareas de demostración: solo se usa en el primer arranque,
 * cuando aún no existe nada en localStorage.
 */

import { toISODate } from '../utils/date-utils';
import type { Task } from '../models';

function dayOffset(days: number): string {
  const now = new Date();
  const base = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  base.setDate(base.getDate() + days);
  return toISODate(base);
}

export function createSeedTasks(): Task[] {
  const now = new Date().toISOString();
  const draft = (
    title: string,
    overrides: Partial<Pick<Task, 'date' | 'time' | 'status' | 'description'>>,
  ): Task => ({
    id: crypto.randomUUID(),
    title,
    description: null,
    date: null,
    time: null,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  });

  return [
    draft('Definir alcance del proyecto', {
      date: dayOffset(0),
      time: '09:30',
      status: 'in-progress',
      description: 'Reunión inicial con el cliente para acotar entregables.',
    }),
    draft('Revisar wireframes', { date: dayOffset(0), time: '16:00' }),
    draft('Preparar informe semanal', {
      date: dayOffset(1),
      time: '11:00',
      description: 'Resumen de velocidad del equipo y bloqueos.',
    }),
    draft('Configurar entorno de pruebas', { date: dayOffset(2), status: 'completed' }),
    draft('Sprint 3: revisión de código', { date: dayOffset(4), time: '10:00' }),
    draft('Escribir documentación de la API', { date: dayOffset(7), time: '15:30' }),
    draft('Comprar licencias de diseño', { date: null }),
    draft('Preparar demo para el cliente', {
      date: null,
      time: null,
      status: 'in-progress',
      description: 'Pendiente de fijar fecha con el equipo.',
    }),
  ];
}
