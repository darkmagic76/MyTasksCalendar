import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { expectNoHorizontalOverflow } from './expect-no-overflow';

/**
 * E2E de datos y render del mapa de calor (spec 001, T8).
 *
 * Todas las fechas se calculan desde «hoy»: la ventana tiene 78–84 celdas
 * según el día de la semana, así que nada se hardcodea.
 */

/** ISO local `YYYY-MM-DD` de una fecha concreta. */
function isoLocal(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Índice de mes (0-11) de una etiqueta corta en español («sept» = 8). */
function mesDeEtiqueta(etiqueta: string): number | undefined {
  const tabla: Record<string, number> = {
    ene: 0,
    feb: 1,
    mar: 2,
    abr: 3,
    may: 4,
    jun: 5,
    jul: 6,
    ago: 7,
    sep: 8,
    sept: 8,
    oct: 9,
    nov: 10,
    dic: 11,
  };
  return tabla[etiqueta];
}

const NIVELES_VALIDOS = ['cero', '0', '1', '2', '3', '4'];
const TEXTO_RF9 =
  'Todavía no has completado ninguna tarea con fecha en estas 12 semanas: marca una como completada';

function celdas(page: Page) {
  return page.locator('[data-testid="heat-cell"]');
}

function niveles(page: Page) {
  return celdas(page).evaluateAll((els) => els.map((el) => el.getAttribute('data-level') ?? ''));
}

test('RF-1/RF-2/RF-12: ventana de 12 semanas, rótulos de mes y anillo de hoy', async ({ page }) => {
  await page.goto('/');

  const hoy = new Date();
  const hoyISO = isoLocal(hoy);
  const diaDeLunes = (hoy.getDay() + 6) % 7; // lun = 0 … dom = 6

  // RF-1: 11 semanas completas + los días de la semana actual hasta hoy.
  await expect(celdas(page)).toHaveCount(77 + diaDeLunes + 1);

  const fechas = await celdas(page).evaluateAll((els) =>
    els.map((el) => el.getAttribute('data-date') ?? ''),
  );
  expect(new Date(`${fechas[0]}T00:00:00`).getDay()).toBe(1); // empieza en lunes
  expect(fechas[fechas.length - 1]).toBe(hoyISO); // termina en hoy
  expect(fechas.every((fecha) => fecha <= hoyISO)).toBe(true); // sin futuro
  expect(new Set(fechas).size).toBe(fechas.length); // sin duplicados

  // RF-2 / RF-4: solo los 6 niveles válidos. Con la semilla el día de hoy
  // tiene tareas sin completar → nivel '0' (RF-3).
  const nivelesVistos = await niveles(page);
  expect(nivelesVistos.every((nivel) => NIVELES_VALIDOS.includes(nivel))).toBe(true);

  const celdaHoy = page.locator(`[data-testid="heat-cell"][data-date="${hoyISO}"]`);
  await expect(celdaHoy).toHaveCount(1);
  await expect(celdaHoy).toHaveAttribute('data-level', '0');

  // RF-12: una única celda de hoy, con el anillo (outline) de marca.
  await expect(page.locator('[data-testid="heat-cell"].is-today')).toHaveCount(1);
  await expect(celdaHoy).toHaveClass(/is-today/);
  const anillo = await celdaHoy.evaluate((el) => {
    const style = getComputedStyle(el);
    return { estilo: style.outlineStyle, grosor: parseFloat(style.outlineWidth) };
  });
  expect(anillo.estilo).not.toBe('none');
  expect(anillo.grosor).toBeGreaterThan(0);

  // Rótulos de mes: 12 casillas (una por columna), al menos dos con texto,
  // cada uno con texto visible y con mes español válido.
  const rotulos = page.locator('.hm-month');
  await expect(rotulos).toHaveCount(12);
  const conTexto = (await rotulos.allTextContents()).map((t) => t.trim()).filter(Boolean);
  expect(conTexto.length).toBeGreaterThanOrEqual(2);
  expect(conTexto.every((t) => mesDeEtiqueta(t) !== undefined)).toBe(true);

  // El primer rótulo es el mes del lunes de inicio de la ventana.
  const ultimoLunes = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - diaDeLunes);
  const primerLunes = new Date(
    ultimoLunes.getFullYear(),
    ultimoLunes.getMonth(),
    ultimoLunes.getDate() - 11 * 7,
  );
  expect(mesDeEtiqueta(conTexto[0])).toBe(primerLunes.getMonth());

  for (const rotulo of await rotulos.all()) {
    if ((await rotulo.textContent())?.trim()) await expect(rotulo).toBeVisible();
  }

  await page.screenshot({
    path: `screenshots/${test.info().project.name}-heat-map.png`,
    fullPage: true,
  });
});

test('RF-6: los niveles no cambian con el filtro «Pendientes»', async ({ page }) => {
  await page.goto('/');

  const antes = await niveles(page);

  await page.getByRole('button', { name: /Pendientes/ }).click();
  expect(await niveles(page)).toEqual(antes);

  await page.getByRole('button', { name: /Todas/ }).click();
  expect(await niveles(page)).toEqual(antes);
});

test('RF-9/RF-2: texto visible con la semilla y oculto al completar una tarea', async ({
  page,
}) => {
  await page.goto('/');

  const hoyISO = isoLocal(new Date());
  const celdaHoy = page.locator(`[data-testid="heat-cell"][data-date="${hoyISO}"]`);
  const texto = page.getByTestId('heat-empty');

  // RF-9: con la semilla la ventana no tiene ninguna completada (la del
  // día +2 cae siempre fuera) → el texto se muestra con su copia exacta.
  await expect(texto).toBeVisible();
  await expect(texto).toHaveText(TEXTO_RF9);

  // Completar una tarea de hoy por la UI (chip → edición → «Completada»).
  await page.locator(`[data-testid="day-cell"][data-date="${hoyISO}"] .task-chip`).first().click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Completada' }).click();
  await dialog.getByRole('button', { name: 'Guardar cambios' }).click();
  await expect(dialog).toBeHidden();

  // RF-2: 1 completada hoy → nivel '1'; RF-9: ya no procede.
  await expect(celdaHoy).toHaveAttribute('data-level', '1');
  await expect(texto).toBeHidden();
});

test('RNF: la página no desborda horizontalmente', async ({ page }) => {
  await page.goto('/');
  await expect(celdas(page).first()).toBeVisible();

  await expectNoHorizontalOverflow(page);
});

// --- T9: interacción y error ---

test('RF-8: el tooltip de ratón aparece al posarse y desaparece al retirarse', async ({ page }) => {
  test.skip(test.info().project.name !== 'desktop', 'El tooltip de ratón es de escritorio (RF-8)');

  await page.goto('/');

  const celdaHoy = page.locator(`[data-testid="heat-cell"][data-date="${isoLocal(new Date())}"]`);
  const tooltip = celdaHoy.getByRole('tooltip');

  await expect(tooltip).toBeHidden();
  await celdaHoy.hover();
  await expect(tooltip).toBeVisible();
  // «<fecha larga> · N completadas» y, si el día tiene sin completar, «· M sin completar».
  await expect(tooltip).toHaveText(/^[A-ZÁÉÍÓÚ][^·]+ · \d+ completadas?( · \d+ sin completar)?$/);

  await page.mouse.move(1, 1); // retira el cursor
  await expect(tooltip).toBeHidden();

  // RNF (plan): sin desbordamiento con el tooltip desplegado en la última columna.
  const ultima = celdas(page).last();
  await ultima.hover();
  await expect(ultima.getByRole('tooltip')).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test('RF-8: en táctil no hay tooltip de ratón', async ({ page }) => {
  test.skip(test.info().project.name !== 'mobile', 'RF-8 solo prohíbe el tooltip en táctil');

  await page.goto('/');

  // El entorno táctil no cumple (hover: hover); sin eso, el CSS de RF-8 no protegería nada.
  expect(await page.evaluate(() => window.matchMedia('(hover: hover)').matches)).toBe(false);

  const celdaHoy = page.locator(`[data-testid="heat-cell"][data-date="${isoLocal(new Date())}"]`);
  await celdaHoy.hover();
  await expect(celdaHoy.getByRole('tooltip')).toBeHidden();
});

test('RF-7: el click abre la hoja y al cerrarla el foco vuelve a la celda', async ({ page }) => {
  await page.goto('/');

  const primeraFecha = (await celdas(page).first().getAttribute('data-date')) ?? '';
  expect(primeraFecha).not.toBe('');

  // RF-7: «tenga o no tareas» → celda vacía (primera) y celda de hoy.
  for (const fecha of [primeraFecha, isoLocal(new Date())]) {
    const celda = page.locator(`[data-testid="heat-cell"][data-date="${fecha}"]`);
    await celda.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('Tareas del día')).toBeVisible();

    await dialog.getByRole('button', { name: 'Cerrar' }).click();
    await expect(dialog).toBeHidden();

    const enfocada = page.locator(':focus');
    await expect(enfocada).toHaveAttribute('data-testid', 'heat-cell');
    await expect(enfocada).toHaveAttribute('data-date', fecha);
  }
});

test('RF-13: Tab da foco visible y tooltip; Enter y Espacio abren la hoja', async ({ page }) => {
  await page.goto('/');

  // Etiqueta accesible «fecha larga · N completadas».
  const primera = celdas(page).first();
  await expect(primera).toHaveAttribute('aria-label', /^[A-ZÁÉÍÓÚ].+ · \d+ completadas?$/);

  // Tab desde el último elemento anterior al mapa → primera celda con foco visible.
  await page.locator('.tray-panel button:has-text("Nueva sin fecha")').press('Tab');
  await expect(primera).toBeFocused();

  const foco = await primera.evaluate((el) => {
    const style = getComputedStyle(el);
    return { estilo: style.outlineStyle, grosor: parseFloat(style.outlineWidth) };
  });
  expect(foco.estilo).not.toBe('none');
  expect(foco.grosor).toBeGreaterThan(0);
  await expect(primera.getByRole('tooltip')).toBeVisible();

  // Enter abre la hoja; Escape la cierra y el foco sigue en la celda.
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText('Tareas del día')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(primera).toBeFocused();

  // Espacio también abre (botón nativo).
  await page.keyboard.press('Space');
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(primera).toBeFocused();
});

test('RF-11: almacén ilegible → rejilla en cero, leyenda y sin texto de RF-9', async ({ page }) => {
  // Misma clave que services/task-storage.ts (los e2e no importan de src).
  const STORAGE_KEY = 'mytaskscalendar.tasks.v1';
  await page.addInitScript((key: string) => {
    window.localStorage.setItem(key, '[]');
    Storage.prototype.setItem = () => {
      throw new Error('setItem roto (RF-11)');
    };
  }, STORAGE_KEY);

  await page.goto('/');

  const nivelesVistos = await niveles(page);
  expect(nivelesVistos.length).toBeGreaterThanOrEqual(78);
  expect(nivelesVistos.every((nivel) => nivel === 'cero')).toBe(true);

  await expect(page.getByTestId('heat-legend')).toBeVisible();
  await expect(page.getByTestId('heat-legend-swatch')).toHaveCount(6);
  await expect(page.getByTestId('heat-empty')).toHaveCount(0); // sin texto de RF-9
  await expect(page.locator('.storage-warning')).toBeVisible();
  await expect(page.locator('[data-testid="day-cell"]')).toHaveCount(42); // calendario usable
});

test('RNF: el tooltip desplegado no desborda el viewport', async ({ page }) => {
  await page.goto('/');

  const ultima = celdas(page).last();

  if (test.info().project.name === 'desktop') {
    await ultima.hover();
  } else {
    // En táctil no hay tooltip de ratón (RF-8): se llega con teclado (RF-13).
    await page.locator('.tray-panel button:has-text("Nueva sin fecha")').press('Tab');
    const total = await celdas(page).count();
    for (let indice = 1; indice < total; indice++) {
      await page.keyboard.press('Tab');
    }
    await expect(ultima).toBeFocused();
  }

  await expect(ultima.getByRole('tooltip')).toBeVisible();
  await expectNoHorizontalOverflow(page);
});
