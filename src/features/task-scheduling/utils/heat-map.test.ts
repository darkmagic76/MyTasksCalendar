import { describe, expect, it } from 'vitest';
import type { Task, TaskStatus } from '../models';
import { countHeat, heatLevel, heatmapDays, heatMapModel } from './heat-map';
import { toISODate } from './date-utils';

let created = 0;
function task(date: string | null, status: TaskStatus = 'pending'): Task {
  created += 1;
  return {
    id: `t${created}`,
    title: 'Tarea',
    description: null,
    date,
    time: null,
    status,
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
  };
}

describe('heatmapDays (RF-1)', () => {
  // 12/10/2026 es lunes y 18/10/2026 es domingo de esa misma semana
  it('hoy lunes → 78 días, empezando un lunes', () => {
    const days = heatmapDays(new Date(2026, 9, 12));
    expect(days).toHaveLength(78); // 11 semanas + lunes transcurrido
    expect(toISODate(days[0])).toBe('2026-07-27'); // 12/10 − 11 semanas
    expect(days[0].getDay()).toBe(1); // lunes
  });

  it('hoy domingo → 84 días (semana completa)', () => {
    const days = heatmapDays(new Date(2026, 9, 18));
    expect(days).toHaveLength(84); // 12 semanas × 7
    expect(toISODate(days[0])).toBe('2026-07-27');
    expect(toISODate(days[days.length - 1])).toBe('2026-10-18');
  });

  it('nunca incluye fechas posteriores a hoy y las columnas empiezan en lunes', () => {
    const hoy = new Date(2026, 9, 14); // miércoles → 80 días
    const isoHoy = toISODate(hoy);
    const days = heatmapDays(hoy);

    expect(days).toHaveLength(80);
    expect(toISODate(days[days.length - 1])).toBe(isoHoy); // termina en hoy
    for (const day of days) expect(toISODate(day) <= isoHoy).toBe(true);
    // Cada 7 días (inicio de columna) cae en lunes
    for (let i = 0; i < days.length; i += 7) expect(days[i].getDay()).toBe(1);
  });
});

describe('heatLevel (RF-2, RF-3, RF-4)', () => {
  it('RF-2: escalones 1 / 2–3 / 4–5 / 6+', () => {
    expect(heatLevel({ completadas: 1, otras: 0 })).toBe('1');
    expect(heatLevel({ completadas: 2, otras: 0 })).toBe('2');
    expect(heatLevel({ completadas: 3, otras: 0 })).toBe('2');
    expect(heatLevel({ completadas: 4, otras: 0 })).toBe('3');
    expect(heatLevel({ completadas: 5, otras: 0 })).toBe('3');
    expect(heatLevel({ completadas: 6, otras: 0 })).toBe('4');
    expect(heatLevel({ completadas: 42, otras: 0 })).toBe('4');
  });

  it('RF-3: actividad sin completadas → nivel 0 tenue', () => {
    expect(heatLevel({ completadas: 0, otras: 1 })).toBe('0');
    expect(heatLevel({ completadas: 0, otras: 12 })).toBe('0');
  });

  it('RF-4: día sin actividad → cero', () => {
    expect(heatLevel({ completadas: 0, otras: 0 })).toBe('cero');
  });
});

describe('countHeat (RF-5, RF-6)', () => {
  it('RF-5: agrupa por fecha e ignora las tareas sin fecha', () => {
    const counts = countHeat([
      task('2026-10-05', 'pending'),
      task('2026-10-05', 'in-progress'),
      task('2026-10-05', 'completed'),
      task(null, 'completed'), // sin fecha → no cuenta en ningún día
    ]);
    expect(counts.size).toBe(1);
    expect(counts.get('2026-10-05')).toEqual({ completadas: 1, otras: 2 });
  });

  it('RF-5: manda el estado actual (completada cuenta, reabierta no)', () => {
    expect(countHeat([task('2026-10-05', 'completed')]).get('2026-10-05')).toEqual({
      completadas: 1,
      otras: 0,
    });
    expect(countHeat([task('2026-10-05', 'pending')]).get('2026-10-05')).toEqual({
      completadas: 0,
      otras: 1,
    });
  });

  it('RF-6: cuenta la lista completa que recibe, sin filtrar por estado', () => {
    const counts = countHeat([
      task('2026-10-05', 'completed'),
      task('2026-10-06', 'pending'),
      task('2026-10-07', 'in-progress'),
    ]);
    expect(counts.size).toBe(3);
    expect(counts.get('2026-10-06')?.otras).toBe(1);
    expect(counts.get('2026-10-07')?.otras).toBe(1);
  });
});

describe('heatMapModel (RF-9, RF-11)', () => {
  const hoy = new Date(2026, 9, 14); // miércoles → 80 celdas

  it('construye las celdas del modelo (nivel, contadores, esHoy)', () => {
    const model = heatMapModel([task('2026-10-12', 'completed')], hoy, false);
    expect(model.cells).toHaveLength(80);
    expect(model.cells.filter((cell) => cell.esHoy)).toHaveLength(1);
    expect(model.cells.find((cell) => cell.esHoy)?.iso).toBe('2026-10-14');
    expect(model.cells.find((cell) => cell.iso === '2026-10-12')).toMatchObject({
      nivel: '1',
      completadas: 1,
      otras: 0,
    });
  });

  it('pone la abreviatura del mes bajo la primera columna de cada mes', () => {
    const { labelsMes } = heatMapModel([], hoy, false);
    expect(labelsMes).toHaveLength(12);
    expect(labelsMes[0]).toBe('jul'); // lunes 27/07
    expect(labelsMes[1]).toBe('ago'); // lunes 03/08
    expect(labelsMes[2]).toBe(''); // semanas repetidas sin cambio de mes
    expect(labelsMes[6].startsWith('sep')).toBe(true); // lunes 07/09
    expect(labelsMes[10]).toBe('oct'); // lunes 05/10
    expect(labelsMes[11]).toBe(''); // lunes 12/10, mismo mes que la anterior
  });

  it('RF-9: sin completadas datadas muestra el texto, incluso con nivel 0', () => {
    const model = heatMapModel([task('2026-10-05', 'pending')], hoy, false);
    expect(model.cells.find((cell) => cell.iso === '2026-10-05')?.nivel).toBe('0');
    expect(model.mostrarTextoInvitacion).toBe(true);
    // También con completadas sin fecha: no cuentan en la ventana
    expect(heatMapModel([task(null, 'completed')], hoy, false).mostrarTextoInvitacion).toBe(true);
  });

  it('RF-9: con alguna completada datada en la ventana no muestra el texto', () => {
    const model = heatMapModel([task('2026-10-05', 'completed')], hoy, false);
    expect(model.mostrarTextoInvitacion).toBe(false);
  });

  it('RF-11: sin datos legibles → todo en cero y sin texto de RF-9', () => {
    const model = heatMapModel([task('2026-10-05', 'completed')], hoy, true);
    expect(model.cells).toHaveLength(80);
    expect(model.cells.every((cell) => cell.nivel === 'cero')).toBe(true);
    expect(model.mostrarTextoInvitacion).toBe(false);
  });
});
