# Tareas — Spec 001 · Mapa de calor de actividad

Estado: implementada (10/10 tareas, fase cerrada con T10)

Regla de implementación (flujo `sdd`): **una sola tarea cada vez** — tests en rojo, código en verde, `npm run validate`, marcar la casilla y parar. 10 tareas (límite del flujo; no hace falta dividir la spec).

- [x] **T1. `startOfWeek` en `utils/date-utils.ts` con su test.** RF-1
- Hecho cuando: `npm run validate` está en verde y el test nuevo afirma que `startOfWeek` devuelve un lunes (p. ej. del 12/10/2026) para cualquier fecha de esa semana.

- [x] **T2. Ventana y escala: tests rojos en `utils/heat-map.test.ts` y su implementación en `heat-map.ts` (`heatmapDays` + `heatLevel`).** RF-1, RF-2, RF-3, RF-4
- Hecho cuando: `npx vitest run src/features/task-scheduling/utils/heat-map.test.ts` pasa con los casos: hoy lunes → 78 días, hoy domingo → 84, sin fechas posteriores a `hoy`, primera columna en lunes, escalones 1 / 2–3 / 4–5 / 6+, `otras>0 y completadas=0` → `'0'`, día vacío → `'cero'`.

- [x] **T3. Conteos y modelo: tests rojos y su implementación (`countHeat` + `heatMapModel` + tipo `HeatLevel`).** RF-5, RF-6, RF-9, RF-11
- Hecho cuando: el mismo `vitest run` pasa con: tareas sin fecha ignoradas, manda el estado actual, `countHeat` cuenta la lista completa que recibe, `mostrarTextoInvitacion` true/false según haya completadas, y `sinDatos=true` implica `mostrarTextoInvitacion=false` con todas las celdas en `'cero'`.

- [x] **T4. Rejilla del componente: `components/heat-map/heat-map.tsx` + `heat-map.css` (botones por celda, niveles, rótulos de mes, anillo de hoy, `aria-label`).** RF-7 (render), RF-12, RF-13 (base)
- Hecho cuando: `npm run validate` en verde y en `npm run dev` se ven 78–84 `<button data-testid="heat-cell" data-level="…">` bajo el calendario, con la celda de hoy con anillo y cada botón con `aria-label` «<fecha larga> · N completadas».

- [x] **T5. Acabados del componente: tooltip, leyenda de 6 muestras y texto de RF-9.** RF-8, RF-9 (render), RF-10, RF-11 (render)
- Hecho cuando: en `npm run dev`, al posar el cursor una celda muestra el tooltip «fecha · N completadas» y al retirarlo desaparece; la leyenda «Menos ▪▪▪▪▪▪ Más» tiene 6 muestras; con la semilla (0 completadas en la ventana) se ve el texto de RF-9.

- [x] **T6. Integración en el contenedor `task-scheduling.tsx` (+ `.heat-map-section` en su css): modelo con `tasks` global, `hoy` fijo y bandera `sinDatos`; `onDayOpen` conectado a la Hoja del día.** RF-6, RF-7, RF-11 (bandera)
- Hecho cuando: con el filtro «Pendientes» activo los `data-level` no cambian, pulsar una celda abre «Tareas del día» y al cerrarla el foco vuelve a la celda, y `npm run validate` sigue en verde.

- [x] **T7. Extraer el helper de overflow a `scripts/e2e/expect-no-overflow.ts` y usarlo desde `app.spec.ts`.** RNF (390/1440)
- Hecho cuando: `npm run e2e` mantiene los 12 tests existentes en verde (10 pasan, 2 skip por diseño) y `app.spec.ts` ya no contiene la función local.

- [x] **T8. E2E de datos y render: `scripts/e2e/heat-map.spec.ts`.** RF-1, RF-2, RF-6, RF-9, RF-12, RNF
- Hecho cuando: `npm run build && npm run e2e` pasa con: nº exacto de celdas `77 + (día de la semana de hoy + 1)`, rótulos de mes visibles, al completar una tarea por UI la celda de hoy pasa a `data-level="1"`, los niveles son idénticos antes/después del filtro «Pendientes», el texto de RF-9 visible con la semilla y oculto tras completar una tarea del mes, la celda de hoy con anillo, y `expectNoHorizontalOverflow` en verde a 1440 y 390 px.

- [x] **T9. E2E de interacción y error: tooltip, click → hoja + foco, teclado y RF-11 con storage roto.** RF-7, RF-8, RF-11, RF-13
- Hecho cuando: `npm run e2e` pasa con: hover muestra/oculta el tooltip, click abre «Tareas del día» y cerrar devuelve el foco a la celda, `Tab` + `Enter` abre la hoja, y con `addInitScript` (clave `'[]'` + `Storage.prototype.setItem` roto) la rejilla queda toda en `'cero'` con leyenda visible y **sin** el texto de RF-9.

- [x] **T10. Documentación y cierre de fase.** Constitución 6, proceso `sdd`
- Hecho cuando: `README.md` describe el mapa de calor, `MEMORY.md` refleja la spec/plan/tareas implementadas, `git diff package.json` está vacío y `npm run validate` + `npm run e2e` cierran en verde.
