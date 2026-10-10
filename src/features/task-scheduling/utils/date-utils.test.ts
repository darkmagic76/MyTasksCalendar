import { describe, expect, it } from 'vitest';
import {
  addMonths,
  formatMonthTitle,
  fromISODate,
  isSameMonth,
  isToday,
  isWeekend,
  monthMatrix,
  startOfMonth,
  startOfWeek,
  toISODate,
} from './date-utils';

describe('toISODate / fromISODate', () => {
  it('serializa a YYYY-MM-DD sin corrimientos de UTC', () => {
    expect(toISODate(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(toISODate(new Date(2026, 11, 31))).toBe('2026-12-31');
  });

  it('recupera la fecha local exacta (ida y vuelta)', () => {
    const iso = '2026-03-14';
    const date = fromISODate(iso);
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(2);
    expect(date.getDate()).toBe(14);
    expect(toISODate(date)).toBe(iso);
  });
});

describe('monthMatrix', () => {
  it('genera 6 semanas × 7 días siempre (42 celdas)', () => {
    for (const month of [new Date(2026, 0, 1), new Date(2026, 1, 1), new Date(2026, 10, 1)]) {
      const matrix = monthMatrix(month);
      expect(matrix).toHaveLength(6);
      for (const week of matrix) expect(week).toHaveLength(7);
    }
  });

  it('empieza en lunes y contiene el mes indicado', () => {
    const matrix = monthMatrix(new Date(2026, 9, 1)); // Octubre 2026
    expect(matrix[0][0].getDay()).toBe(1); // lunes
    // La primera celda es lunes, en o antes del 1 de octubre
    expect(matrix[0][0].getTime()).toBeLessThanOrEqual(new Date(2026, 9, 1).getTime());
    // Todas las celdas de la matriz contienen octubre en algún momento
    const days = matrix.flat().map(toISODate);
    expect(days).toContain('2026-10-01');
    expect(days).toContain('2026-10-31');
  });
});

describe('navegación de meses', () => {
  it('addMonths cruza años correctamente', () => {
    const march = new Date(2026, 2, 10);
    expect(toISODate(addMonths(march, 1))).toBe('2026-04-01');
    expect(toISODate(addMonths(march, -3))).toBe('2025-12-01');
    expect(toISODate(addMonths(new Date(2026, 11, 15), 2))).toBe('2027-02-01');
  });

  it('startOfMonth normaliza al día 1', () => {
    expect(toISODate(startOfMonth(new Date(2026, 6, 17)))).toBe('2026-07-01');
  });

  it('startOfWeek devuelve el lunes de la semana que contiene la fecha', () => {
    // 12/10/2026 es lunes
    expect(toISODate(startOfWeek(new Date(2026, 9, 12)))).toBe('2026-10-12'); // el mismo lunes
    expect(toISODate(startOfWeek(new Date(2026, 9, 14)))).toBe('2026-10-12'); // miércoles
    expect(toISODate(startOfWeek(new Date(2026, 9, 18)))).toBe('2026-10-12'); // domingo → lunes anterior
    expect(toISODate(startOfWeek(new Date(2026, 8, 28)))).toBe('2026-09-28'); // lunes de otra semana
  });

  it('isSameMonth compara año y mes', () => {
    expect(isSameMonth(new Date(2026, 5, 30), new Date(2026, 5, 1))).toBe(true);
    expect(isSameMonth(new Date(2026, 5, 1), new Date(2026, 6, 1))).toBe(false);
    expect(isSameMonth(new Date(2025, 5, 1), new Date(2026, 5, 1))).toBe(false);
  });
});

describe('predicados de día', () => {
  it('isToday reconoce solo el día actual', () => {
    expect(isToday(new Date())).toBe(true);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(isToday(yesterday)).toBe(false);
  });

  it('isWeekend marca sábados y domingos', () => {
    expect(isWeekend(new Date(2026, 9, 3))).toBe(true); // sábado
    expect(isWeekend(new Date(2026, 9, 4))).toBe(true); // domingo
    expect(isWeekend(new Date(2026, 9, 5))).toBe(false); // lunes
  });
});

describe('formatMonthTitle', () => {
  it('produce un título en español capitalizado', () => {
    expect(formatMonthTitle(new Date(2026, 9, 1))).toBe('Octubre 2026');
    expect(formatMonthTitle(new Date(2026, 0, 1))).toBe('Enero 2026');
  });
});
