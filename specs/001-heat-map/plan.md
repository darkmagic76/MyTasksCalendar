# Plan — Spec 001 · Mapa de calor de actividad

Estado: aprobado e implementado

## Archivos y responsabilidades

### Se crean

| Fichero                                                         | Responsabilidad                                                                                                                         | RF                                                      |
| --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `src/features/task-scheduling/utils/heat-map.ts`                | Toda la lógica pura: ventana de 12 semanas, agrupación de conteos, escala de niveles y modelo final. Sin `new Date()` interno, sin DOM. | RF-1, RF-2, RF-3, RF-4, RF-5, RF-6*, RF-9, RF-11¹       |
| `src/features/task-scheduling/utils/heat-map.test.ts`           | Tests unitarios (vitest) de todo lo anterior con `hoy` fijo.                                                                            | RF-1…RF-5, RF-9, RF-11                                  |
| `src/features/task-scheduling/components/heat-map/heat-map.tsx` | Componente presentacional: rejilla de botones, tooltip, leyenda, texto vacío, marca de hoy y accesibilidad. Recibe todo por props.      | RF-7, RF-8, RF-9, RF-10, RF-11², RF-12, RF-13           |
| `src/features/task-scheduling/components/heat-map/heat-map.css` | 6 tokens de nivel ordenados por luminosidad, rejilla 12×7, tooltip, rótulos de mes, responsive.                                         | RNF sin-scroll, RNF orden de color                      |
| `scripts/e2e/heat-map.spec.ts`                                  | E2E Playwright (desktop + móvil): render, niveles, tooltip, teclado, click → hoja, estado vacío, RF-11, filtros.                        | RF-1, RF-2, RF-6, RF-7, RF-8, RF-9, RF-11, RF-12, RF-13 |
| `scripts/e2e/expect-no-overflow.ts`                             | Helper de overflow extraído (hoy está dentro de `app.spec.ts`).                                                                         | RNF 390/1440                                            |

### Se modifican

| Fichero                            | Cambio                                                                                                                                                                           | RF                  |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| `task-scheduling.tsx`              | Contenedor: `useMemo` con `heatMapModel(tasks, hoy, …)` usando **`tasks` global (no `visibleTasks`)**, renderiza la sección y conecta `onDayOpen` con la Hoja del día existente. | RF-6*, RF-7, RF-11¹ |
| `task-scheduling.css`              | Regla `.heat-map-section` (posición bajo `app-layout`, sin competir con la toolbar).                                                                                             | —                   |
| `utils/date-utils.ts` + `.test.ts` | Nueva `startOfWeek(date)` (lunes, misma convención `WEEK_START = 1` que ya usa `monthMatrix`).                                                                                   | RF-1                |
| `scripts/e2e/app.spec.ts`          | Importa el helper de overflow; **los 6 tests existentes no cambian**.                                                                                                            | RNF                 |
| `README.md` · `MEMORY.md`          | Describir la característica; MEMORY al cerrar la fase (flujo `sdd`).                                                                                                             | Constitución 6      |

\* RF-6: el _cumplimiento_ vive en el contenedor (pasa la lista global); la unidad prueba que `countHeat` cuenta lo que recibe.
¹ RF-11: la decisión «¿hay datos legibles?» es `sinDatos = !storageOk && tasks.length === 0` (bandera calculada en el contenedor, consumida en el modelo).
² RF-11: el componente pinta «cero + leyenda, sin texto» cuando el modelo lo indica.

## Funciones puras (todas con `hoy` como parámetro)

```ts
// utils/date-utils.ts
startOfWeek(date: Date): Date            // lunes de la semana de `date`

// utils/heat-map.ts
type HeatLevel = 'cero' | '0' | '1' | '2' | '3' | '4';

heatmapDays(hoy: Date): Date[]           // RF-1: desde el lunes hace 11 semanas hasta `hoy` (sin futuros)
countHeat(tasks: Task[]): Map<string, { completadas: number; otras: number }>  // RF-5, RF-6
heatLevel(c: { completadas: number; otras: number }): HeatLevel               // RF-2, RF-3, RF-4
heatMapModel(tasks: Task[], hoy: Date, sinDatos: boolean): HeatMapModel
    // → cells[] { iso, nivel, completadas, otras, esHoy }, labelsMes[12],
    //   mostrarTextoInvitacion (RF-9), nivelCeroTotal (RF-11)
```

Reglas: `sin fecha → no cuenta` (RF-5); `sinDatos=true → sin texto de invitación` (RF-11); el modelo **no** recibe nunca la lista filtrada (RF-6).

## Algoritmo (pseudocódigo)

```
FUNCIÓN heatMapModel(tareas, hoy, sinDatos):
    primerLunes ← startOfWeek(hoy) − 11 semanas
    días ← []
    PARA col ← 0 HASTA 11:
        PARA d ← 0 HASTA 6:                    // lunes..domingo
            fecha ← primerLunes + col·7 + d
            SI fecha ≤ hoy ENTONCES días ← días + fecha      // sin futuros (RF-1)

    conteos ← agruparPorFecha(tareas)          // ignora fecha=null; usa estado actual (RF-5)

    PARA CADA fecha EN días:
        nivel ← heatLevel(conteos[fecha] o {0,0})            // RF-2/3/4
        cells ← cells + { fecha, nivel, esHoy: fecha = hoy, … }

    // Rótulos: mes del lunes de la columna; etiqueta cuando cambia respecto a la anterior
    labelsMes ← []
    mesAnterior ← null
    PARA col ← 0 HASTA 11:
        m ← mes(del lunes de la columna col)
        labelsMes[col] ← (m ≠ mesAnterior) ? abreviatura(m) : ""
        mesAnterior ← m

    mostrarTexto ← (ningún nivel ≥ '1') Y NO sinDatos       // RF-9 + RF-11
    DEVUELVE { cells, labelsMes, mostrarTexto }

FUNCIÓN heatLevel({completadas, otras}):
    completadas ≥ 6 → '4'   ≥4 → '3'   ≥2 → '2'   =1 → '1'   // RF-2
    completadas = 0 Y otras > 0 → '0'                        // RF-3
    otro caso → 'cero'                                       // RF-4
```

## Interfaz (cómo se pinta)

```
app-layout (existente: calendario + bandeja)
┌ heat-map-section ─────────────────────────────────────────┐
│ ┌─ rejilla (repeat(12, minmax(0,1fr)), gap 3px, máx 440px,│ │
│   celdas <button> cuadradas (aspect-ratio 1), data-testid │
│   = heat-cell, data-level, data-date, aria-label = RF-13  │
│   ]  oct  nov…   ← rótulos bajo la rejilla (12 columnas)  │
│   Leyenda: 6 muestras  «Menos ▪▪▪▪▪▪ Más» (RF-10)        │
│   Texto RF-9 (solo si mostrarTexto)                       │
└────────────────────────────────────────────────────────────┘
```

- **Sección**: bajo `main.app-layout`, a ancho completo, alineada a la izquierda; se apila tras la bandeja en móvil.
- **Tooltip (RF-8)**: `div role="tooltip"` dentro de cada botón, visible con CSS `:hover` / `:focus-visible` (sin JS); anclado `bottom: 100%`, y en la primera/última columna se alinea hacia dentro para no desbordar.
- **Niveles**: `--hm-cero` (gris al 6 %) y `--hm-0…4` (`color-mix(--primary X%, --surface)` con X creciente) → 6 valores distintos y ordenados por luminosidad (RNF).
- **Hoy (RF-12)**: anillo `--primary-strong` en la celda, sin pisar el color de nivel.
- **Teclado (RF-13)**: botones nativos → Tab, foco visible heredado del sistema, Enter/Espacio abren la hoja; `aria-label` = «<fecha larga> · N completadas».

## Decisiones técnicas (justificación y alternativa descartada)

1. **Vive dentro de `task-scheduling`** (Scope Rule: un solo feature lo consume). _Descartada_: feature `activity-heatmap` → obligaría a extraer `Task`, `useTasks` y la Hoja del día a `shared/` en la misma iteración; movimiento grande para un proyecto educativo cuando la regla es «extraer con uso real confirmado».
2. **`hoy` como parámetro** en todas las funciones. _Descartada_: `new Date()` dentro → tests dependientes de reloj y de la fecha real.
3. **`startOfWeek` en `date-utils.ts`**. _Descartada_: duplicar «lunes» en `heat-map.ts` → dos convenciones de `WEEK_START` que pueden divergir.
4. **Botones nativos para las celdas**. _Descartada_: `<div onClick>` → obligaría a reimplementar foco, Enter/Espacio y ARIA a mano.
5. **Tooltip en CSS puro** (`:hover`/`:focus-visible`). _Descartada_: estado `useState` en el componente → más código y ciclos de render para el mismo resultado.
6. **Hooks `data-testid`/`data-level`**. _Descartada_: leer `getComputedStyle` en e2e → frágil ante cambios de tokens.
7. **Vitest se queda como está** (node, `*.test.ts`, solo lógica pura); render/interacción va a e2e. _Descartada_: migrar a jsdom con tests de componente → amplía configuración sin necesidad (Constitución 4 y criterios de la spec ya dividen el trabajo).
8. **Anillo para «hoy», no tinte de fondo**. _Descartada_: reutilizar el fondo del calendario → pisaría el color de nivel y ocultaría el dato principal.
9. **Sin título visible nuevo** (solo `aria-label` de sección). _Descartada_: añadir «Actividad reciente» → copy nuevo sin aprobar en la spec (Constitución 2).
10. **`useMemo` con `hoy` fijo al montar; sin temporizadores**. _Descartada_: intervalo a medianoche → proceso en segundo plano que la spec libera explícitamente.
11. **Banderada `sinDatos` en el contenedor** (`storageOk` ya existe en `useTasks`). _Descartada_: que el mapa lea localStorage → duplicaría la lógica de persistencia (Constitución 3).
12. **Helper de overflow extraído a fichero compartido**. _Descartada_: copiarlo en el spec nuevo → dos versiones que pueden desincronizarse.

## Estrategia de tests

**1. `npm run validate`** — eslint + `tsc -b` + vitest:

- `heat-map.test.ts` (hoy fijo, p. ej. `new Date(2026, 9, 9)`):
  - RF-1: hoy lunes → 78 días; hoy domingo → 84; primera columna lunes; ninguna fecha posterior a `hoy`; rótulos «oct/nov» cuando cambia el mes.
  - RF-2: escalones 1 / 2–3 / 4–5 / 6+; RF-3: `otras>0, completadas=0` → `'0'`; RF-4: día vacío → `'cero'`.
  - RF-5: tareas sin fecha ignoradas; el estado actual manda (completada cuenta, reabierta no).
  - RF-6: `countHeat` cuenta la lista completa que recibe.
  - RF-9: `mostrarTexto` con/sin completadas (y con nivel 0 presente); RF-11: `sinDatos=true` → sin texto y todo `'cero'`.
- `date-utils.test.ts`: `startOfWeek` (lunes de una semana conocida).
- La aprobación de `tsc` valida la unión literal `HeatLevel` (imposible pintar un nivel inexistente).

**2. `npm run build` → `npm run e2e`** (preview sirve `dist/`: primero build) — `heat-map.spec.ts`, corre en desktop y móvil:

- RF-1: nº exacto de celdas = `77 + (díaDeLaSemana(hoy)+1)`; 12 columnas; rótulos de mes.
- RF-2/RNF: crear tarea, marcarla «Completada» por UI → la celda de hoy pasa a `data-level="1"` sin recargar.
- RF-6: capturar `data-level` de todas las celdas, filtrar «Pendientes» → idénticos.
- RF-7: click → «Tareas del día»; cerrar → el foco vuelve a la celda.
- RF-8: hover → tooltip visible con fecha larga y «· N completadas»; retirar cursor → oculto.
- RF-9: con la semilla (la completada de `+2` siempre cae fuera de la ventana) el texto es visible; al completar una tarea del mes, desaparece.
- RF-11: `addInitScript` con clave `'[]'` + `Storage.prototype.setItem` roto → rejilla en `'cero'`, leyenda visible, **sin** texto de RF-9.
- RF-12: celda de hoy con su anillo; RF-13: Tab hasta el mapa + Enter abre la hoja.
- RNF: `expectNoHorizontalOverflow` en 1440 y 390 px con el tooltip desplegado en la última columna.

**3. Orden de verificación** (AGENTS.md): `validate` → `build` → `e2e`; el pre-commit ya ejecuta `validate`.

## Cobertura RF → parte

| RF          | Cubierto por                                                         |
| ----------- | -------------------------------------------------------------------- |
| RF-1        | `heatmapDays` + test ventana · e2e nº celdas/columnas/rótulos        |
| RF-2        | `heatLevel` + tests escalones · e2e nivel `1` por UI                 |
| RF-3 · RF-4 | `heatLevel` + tests · e2e nivel `'0'` (semilla) y `'cero'` (RF-11)   |
| RF-5        | `countHeat` + tests · e2e implícito (estado actual al editar)        |
| RF-6        | contenedor pasa `tasks` global · test unidad · e2e con filtro        |
| RF-7        | `heat-map.tsx` + `setOpenDay` en contenedor · e2e click/teclado/foco |
| RF-8        | tooltip CSS · e2e hover                                              |
| RF-9        | `mostrarTexto` en modelo + test · e2e texto visible→oculto           |
| RF-10       | leyenda en componente · e2e visibilidad y 6 muestras                 |
| RF-11       | bandera `sinDatos` + test · e2e con storage roto                     |
| RF-12       | clase/anillo `is-today` · e2e                                        |
| RF-13       | botones nativos + `aria-label` · e2e Tab+Enter                       |
