/**
 * Lógica pura del mapa de calor de actividad (spec 001).
 *
 * Sin `new Date()` interno: la fecha actual siempre entra como parámetro
 * (`hoy`) para que los tests no dependan del reloj de la máquina (plan, D2).
 */

import type { Task } from '../models';
import { startOfWeek, toISODate } from './date-utils';

/** Los 6 estados del mapa, de menor a mayor actividad (RF-4 → RF-2). */
export type HeatLevel = 'cero' | '0' | '1' | '2' | '3' | '4';

/** Conteo de un día concreto del mapa. */
export interface HeatCount {
  completadas: number;
  otras: number;
}

/** Una celda de la rejilla: fecha, su nivel y de dónde sale. */
export interface HeatCell {
  iso: string; // YYYY-MM-DD
  fecha: Date;
  nivel: HeatLevel;
  completadas: number;
  otras: number;
  esHoy: boolean;
}

export interface HeatMapModel {
  cells: HeatCell[];
  /** 12 entradas (una por columna): abreviatura del mes o '' si no cambia. */
  labelsMes: string[];
  /** RF-9 (desactivado por RF-11): texto de invitación cuando no hay completadas. */
  mostrarTextoInvitacion: boolean;
}

const MONTH_SHORT_FORMAT = new Intl.DateTimeFormat('es-ES', { month: 'short' });

const WEEK_COLUMNS = 12;
const WEEKS_BACK = WEEK_COLUMNS - 1; // la última columna es la semana de hoy

/**
 * RF-1: ventana de 12 columnas (semanas) alineadas al lunes que termina en
 * `hoy`: desde el lunes hace 11 semanas hasta `hoy` inclusive, sin días
 * futuros. El resultado tiene entre 78 y 84 días según el día de la semana.
 */
export function heatmapDays(hoy: Date): Date[] {
  const lastMonday = startOfWeek(hoy);
  const firstMonday = new Date(lastMonday);
  firstMonday.setDate(firstMonday.getDate() - WEEKS_BACK * 7);

  const isoHoy = toISODate(hoy);
  const days: Date[] = [];
  const cursor = new Date(firstMonday);

  // Comparación por ISO (YYYY-MM-DD ordena lexicográficamente): sin horas de por medio.
  while (toISODate(cursor) <= isoHoy) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
}

/**
 * RF-2 / RF-3 / RF-4: escala de niveles por día.
 * - ≥6 completadas → '4'; 4–5 → '3'; 2–3 → '2'; 1 → '1'
 * - 0 completadas con otras tareas → '0' (tenue, hay actividad)
 * - sin actividad → 'cero'
 */
export function heatLevel(count: HeatCount): HeatLevel {
  if (count.completadas >= 6) return '4';
  if (count.completadas >= 4) return '3';
  if (count.completadas >= 2) return '2';
  if (count.completadas === 1) return '1';
  if (count.completadas === 0 && count.otras > 0) return '0';
  return 'cero';
}

/**
 * RF-5: cuenta las tareas con fecha, agrupadas por `YYYY-MM-DD`.
 * - Las tareas sin fecha no cuentan en ningún día.
 * - Manda el estado actual: `completed` incrementa `completadas`; el resto, `otras`.
 *
 * RF-6: la función no filtra: cuenta la lista completa que recibe (es el
 * contenedor quien debe pasarle `tasks` sin filtrar).
 */
export function countHeat(tasks: Task[]): Map<string, HeatCount> {
  const counts = new Map<string, HeatCount>();
  for (const task of tasks) {
    if (task.date === null) continue;
    const count = counts.get(task.date) ?? { completadas: 0, otras: 0 };
    if (task.status === 'completed') count.completadas += 1;
    else count.otras += 1;
    counts.set(task.date, count);
  }
  return counts;
}

function monthLabel(date: Date): string {
  return MONTH_SHORT_FORMAT.format(date).replace('.', '');
}

/**
 * Rótulos de mes: la abreviatura aparece bajo la primera columna que empieza
 * en un mes nuevo (RF-1); la primera columna siempre lleva la suya.
 */
function columnMonthLabels(days: Date[]): string[] {
  const labels: string[] = [];
  let previousMonth: number | null = null;
  for (let column = 0; column < WEEK_COLUMNS; column++) {
    const monday = days[column * 7]; // la ventana empieza en lunes: cada 7, una columna
    const month = monday.getMonth();
    labels.push(month === previousMonth ? '' : monthLabel(monday));
    previousMonth = month;
  }
  return labels;
}

/**
 * Modelo completo del mapa (RF-1, RF-5, RF-9, RF-11).
 *
 * @param sinDatos true cuando el almacén no es legible y no hay tareas
 * válidas en memoria (RF-11): se ignoran los conteos, todas las celdas
 * quedan en 'cero' y no se muestra el texto de RF-9.
 */
export function heatMapModel(tasks: Task[], hoy: Date, sinDatos: boolean): HeatMapModel {
  const days = heatmapDays(hoy);
  const isoHoy = toISODate(hoy);
  const counts = sinDatos ? new Map<string, HeatCount>() : countHeat(tasks);

  const cells: HeatCell[] = days.map((fecha) => {
    const iso = toISODate(fecha);
    const count = counts.get(iso) ?? { completadas: 0, otras: 0 };
    return {
      iso,
      fecha,
      nivel: sinDatos ? 'cero' : heatLevel(count),
      completadas: count.completadas,
      otras: count.otras,
      esHoy: iso === isoHoy,
    };
  });

  // RF-9: texto solo si la ventana no contiene ninguna tarea completada
  // con fecha; RF-11 lo desactiva cuando no hay datos legibles.
  const mostrarTextoInvitacion = !sinDatos && cells.every((cell) => cell.completadas === 0);

  return { cells, labelsMes: columnMonthLabels(days), mostrarTextoInvitacion };
}
