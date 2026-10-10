import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { expectNoHorizontalOverflow } from './expect-no-overflow';

/** ISO local `YYYY-MM-DD` para un desplazamiento de días desde hoy. */
function isoOffset(days: number): string {
  const now = new Date();
  const base = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  base.setDate(base.getDate() + days);
  const y = base.getFullYear();
  const m = String(base.getMonth() + 1).padStart(2, '0');
  const d = String(base.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function screenshot(page: Page, name: string) {
  const project = test.info().project.name;
  return page.screenshot({
    path: `screenshots/${project}-${name}.png`,
    fullPage: true,
  });
}

test('la aplicación carga y no desborda horizontalmente', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'MyTasksCalendar' })).toBeVisible();
  await expect(page.getByTestId('task-tray')).toBeVisible();
  await expect(page.locator('[data-testid="day-cell"]').first()).toBeVisible();

  // Rejilla completa: 6 semanas × 7 días
  await expect(page.locator('[data-testid="day-cell"]')).toHaveCount(42);

  await expectNoHorizontalOverflow(page);
  await screenshot(page, '01-home');
});

test('crear tarea: valida el título y crea la tarea', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Nueva tarea' }).click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await screenshot(page, '02-formulario');

  // Validación: con el título vacío no se puede crear
  await dialog.getByRole('button', { name: 'Crear tarea' }).click();
  await expect(dialog.getByText('El título es obligatorio.')).toBeVisible();
  await expect(dialog).toBeVisible();

  await dialog.locator('#task-title').fill('Tarea creada en e2e');
  await dialog.locator('#task-time').fill('12:45');
  await dialog.getByRole('button', { name: 'Crear tarea' }).click();

  await expect(dialog).toBeHidden();
  const chip = page.locator('.task-chip', { hasText: 'Tarea creada en e2e' });
  await expect(chip).toHaveCount(1);
  await expect(chip).toHaveAttribute('data-status', 'pending');
  // La cabecera precarga hoy → debe aparecer en la celda de hoy
  await expect(
    page.locator(`[data-date="${isoOffset(0)}"] .task-chip`, { hasText: 'Tarea creada en e2e' }),
  ).toHaveCount(1);

  await expectNoHorizontalOverflow(page);
});

test('drag & drop: mueve una tarea de la bandeja a un día y persiste', async ({ page }) => {
  test.skip(test.info().project.name !== 'desktop', 'Arrastre con ratón verificado en escritorio');

  await page.goto('/');

  // El día +3 no tiene tareas de la semilla, así el conteo es determinista.
  const targetDate = isoOffset(3);
  const targetCell = page.locator(`[data-date="${targetDate}"]`);
  await expect(targetCell).toHaveCount(1);

  const trayChip = page.locator('[data-testid="task-tray"] .task-chip').first();
  const taskId = await trayChip.getAttribute('data-task-id');
  expect(taskId).toBeTruthy();

  const trayCountBefore = await page.locator('[data-testid="task-tray"] .task-chip').count();

  await trayChip.dragTo(targetCell, { steps: 25 });

  // La tarea está en el día de destino y ya no en la bandeja
  await expect(page.locator(`[data-date="${targetDate}"] [data-task-id="${taskId}"]`)).toHaveCount(
    1,
  );
  await expect(page.locator(`[data-testid="task-tray"] [data-task-id="${taskId}"]`)).toHaveCount(0);
  await expect(page.locator('[data-testid="task-tray"] .task-chip')).toHaveCount(
    trayCountBefore - 1,
  );

  // El drop no debe abrir diálogos por el click residual
  await expect(page.getByRole('dialog')).toHaveCount(0);

  // Persistencia: tras recargar, el movimiento sigue ahí
  await page.reload();
  await expect(page.locator(`[data-date="${targetDate}"] [data-task-id="${taskId}"]`)).toHaveCount(
    1,
  );

  await screenshot(page, '03-tras-drag');
});

test('editar: cambiar el estado a En curso', async ({ page }) => {
  await page.goto('/');

  const chip = page.locator('.task-chip[data-status="pending"]').first();
  // El id se captura ANTES de editar: si guarda bien, este chip deja de
  // coincidir con el localizador filtrado por «pending».
  const editedId = await chip.getAttribute('data-task-id');
  expect(editedId).toBeTruthy();

  await chip.click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('.modal-title')).toHaveText('Editar tarea');

  const segButton = dialog.getByRole('button', { name: 'En curso' });
  await segButton.click();
  // El estado seleccionado debe reflejarse antes de guardar
  await expect(segButton).toHaveAttribute('aria-pressed', 'true');

  await dialog.getByRole('button', { name: 'Guardar cambios' }).click();
  await expect(dialog).toBeHidden();
  await expect(page.locator(`.task-chip[data-task-id="${editedId}"]`)).toHaveAttribute(
    'data-status',
    'in-progress',
  );
});

test('filtros: solo muestra el estado seleccionado', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: /Completadas/ }).click();

  const statuses = await page
    .locator('.calendar-month .task-chip, [data-testid="task-tray"] .task-chip')
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-status')));
  expect(statuses.length).toBeGreaterThan(0);
  expect(new Set(statuses)).toEqual(new Set(['completed']));

  await page.getByRole('button', { name: /Todas/ }).click();
  const allStatuses = await page
    .locator('.calendar-month .task-chip')
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-status')));
  expect(new Set(allStatuses).size).toBeGreaterThan(1);
});

test('hoja del día: lista de tareas al tocar el número del día', async ({ page }) => {
  test.skip(test.info().project.name !== 'mobile', 'La hoja se verifica en la vista móvil');

  await page.goto('/');

  await page.locator(`[data-date="${isoOffset(0)}"] .day-number`).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText('Tareas del día')).toBeVisible();

  await screenshot(page, '04-hoja-dia');

  await dialog.getByRole('button', { name: 'Añadir tarea en este día' }).click();
  await expect(page.locator('#task-title')).toBeVisible();
  await screenshot(page, '05-formulario-movil');

  await expectNoHorizontalOverflow(page);
});
