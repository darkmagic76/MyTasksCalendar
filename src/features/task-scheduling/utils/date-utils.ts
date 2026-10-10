/**
 * Utilidades de fecha locales (sin dependencias, sin problemas de UTC).
 * Todas las fechas se manejan como `Date` local y se serializan a
 * `YYYY-MM-DD` manualmente para evitar corrimientos de zona horaria.
 */

const WEEK_START = 1; // Lunes

const MONTH_TITLE_FORMAT = new Intl.DateTimeFormat('es-ES', { month: 'long' });
const YEAR_FORMAT = new Intl.DateTimeFormat('es-ES', { year: 'numeric' });
const WEEKDAY_FORMAT = new Intl.DateTimeFormat('es-ES', { weekday: 'short' });
const FULL_DATE_FORMAT = new Intl.DateTimeFormat('es-ES', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function fromISODate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * Lunes de la semana que contiene la fecha (misma convención `WEEK_START = 1`
 * que usa `monthMatrix`): única fuente de verdad de "empezar en lunes".
 */
export function startOfWeek(date: Date): Date {
  const offset = (date.getDay() - WEEK_START + 7) % 7;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - offset);
}

export function addMonths(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

export function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

export function isSameDay(a: Date, b: Date): boolean {
  return toISODate(a) === toISODate(b);
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

/**
 * Matriz estable de 6 semanas × 7 días que contiene al mes indicado.
 * Siempre devuelve 42 celdas para que la rejilla no cambie de altura.
 */
export function monthMatrix(month: Date): Date[][] {
  const cursor = startOfWeek(startOfMonth(month));
  const weeks: Date[][] = [];

  for (let week = 0; week < 6; week++) {
    const days: Date[] = [];
    for (let day = 0; day < 7; day++) {
      days.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(days);
  }

  return weeks;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** "Octubre 2026" */
export function formatMonthTitle(date: Date): string {
  return `${capitalize(MONTH_TITLE_FORMAT.format(date))} ${YEAR_FORMAT.format(date)}`;
}

/** "lun", "mar"… (primera letra en minúscula vía Intl, capitalizada aquí). */
export function formatWeekdayShort(date: Date): string {
  return capitalize(WEEKDAY_FORMAT.format(date).replace('.', ''));
}

/** "martes, 13 de octubre de 2026" */
export function formatFullDate(iso: string): string {
  return capitalize(FULL_DATE_FORMAT.format(fromISODate(iso)));
}
