# MEMORY.md — My Tasks Calendar

Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no aporte.
No duplicar README ni AGENTS.md (características, comandos, árbol y persistencia ya están ahí).

## Estado actual

- **Spec 002 («minutos y racha») DESCARTADA y revertida el 13/10/2026** (decisión del usuario tras 5/8 tareas). Ya no existe código suyo: `validate` 31 tests y `e2e` 28+4 en verde, 001 intacta. **No volver a intentar esa spec tal cual**; si algún día se quiere la racha, escribir una **spec 003 solo-racha** (sin minutos, sin RF-4) desde cero.
- v1 + **mapa de calor de actividad** funcionando: organizador de tareas en calendario mensual con drag & drop, guardado en localStorage y rejilla de 12 semanas bajo el calendario.
- `AGENTS.md` ampliado con la sección "Repo facts" (comandos, e2e, quirks de TS/lint) verificada contra la config.
- Diseño revisado con el skill frontend-design: `validate` + build + e2e en verde tras los cambios.
- `docs/constitution.md` creada y aprobada: 6 principios innegociables (stack, spec-manda, lógica/interfaz, tests, datos, español). Rige todo el flujo SDD.
- `specs/001-heat-map/spec.md` **implementada y cerrada** (10/10 tareas): 13 RF en EARS, 0 dudas abiertas (QA con 29 hallazgos + clarificación integrada). `plan.md` **aprobado e implementado** (12 decisiones, Scope Rule intacta) y `tasks.md` cerrada con T10.
- Repaso final: `README.md` con la sección «Mapa de calor de actividad», `npm run validate` (31 tests) y `npm run e2e` (**32 tests → 28 passed + 4 skip**, 35 s) en verde, `git diff package.json` vacío. Verificación manual en Chromium durante T5/T6: `verify-t5.mjs` (24 checks) y `verify-t6.mjs` (19, con rojo previo de 7).

## Decisiones y porqué

1. `models`, `utils`, `hooks`, `components` → dentro de `task-scheduling`: solo los consume un feature (Scope Rule). Si una segunda feature necesita `Task`, se extraerá a `shared/`.
2. `infrastructure/storage` → técnico, sin semántica de negocio, reutilizable por cualquier feature futura (ajustes, sesión…): por eso no vive en el feature.
3. El contenedor se llama `task-scheduling` (igual que el feature) y los componentes son presentacionales puros que reciben props.
4. npm es el gestor canónico (`package-lock.json` trackeado); existen `pnpm-lock.yaml`/`pnpm-workspace.yaml` sin trackear — no borrar (excluye `vite@8.3.4` de la política de minimum-release-age).
5. Diseño "agenda editorial" (revisión frontend-design): el titular es «Octubre 2026» en display clamp(21→34px); marca violada `#5c2ae0` (no indigo-600 de plantilla); columnas de fin de semana tintadas al 4.5%; días de semana en minúsculas; sin gradientes decorativos. El color de UI queda reservado para estado de tareas + interacción. No reintroducir ALL-CAPS en labels ni glow radial del body.
6. Tooltip RF-8 en CSS puro dentro del botón (`<span>`, no `<div>`: contenido de `<button>` ha de ser frase): se muestra con `@media (hover: hover) + :hover` (táctil sin tooltip) y con `:focus-visible` (RF-13). Alineación para no desbordar: 1ª columna por la izq., últimas 7 celdas por la der., y en `max-width:699px` desde el hijo 50 (columna 8) por la der. `max-width: min(240px, 46vw)` con wrap.
7. Colores de nivel como tokens `--hm-cero`/`--hm-0…4` en `.heat-map`, compartidos por celdas y muestras de leyenda (una sola fuente de verdad, RNF de luminosidad).
8. RF-7 (devolver el foco) resuelta en `useDialog`: guarda `document.activeElement` al montar y lo restaura al desmontar si sigue `isConnected`; y el backdrop de hoja y formulario hace `preventDefault()` en `mousedown` (el foco por defecto del ratón pisa la restauración). Alternativa descartada: `setTimeout` de restauración → roba el foco al abrir el formulario desde la hoja.

## Aprendizajes y errores a evitar

- **Por qué se descartó la spec 002** (lección de alcance, no de código): (a) su RF-4 impedía completar una tarea programada para las 18:00 a las 10:00, o sea rompía el uso normal; (b) empapaba dos features distintos —registro de minutos y racha— que solo comparten `completedDate`; (c) parte de sus RF (RF-2 y la precarga de hoy desde la cabecera) ya existían y ya estaban cubiertos por la 001, así que inflaba el alcance. Antes de implementar, **comprobar que un requisito no forbids algo razonable**, y **una spec = una feature**.
- Una spec que obliga a inventar justificaciones para no romperla tiene un problema de diseño, no de redacción.

- Repasar la spec como QA antes del plan compensa: detectó 29 hallazgos, incluido un error de aritmética («78 celdas» cuando 12×7=84) y un texto de estado vacío que mentía al usuario con tareas sin fecha.
- Verificación visual: `getComputedStyle(...).backgroundColor` devuelve `color(srgb …)` (no `rgb(…)`) en `color-mix` → los parsers `rgb()` fallan. Y la semilla solo tiene niveles `cero`/`0`: comparar la leyenda solo contra los niveles presentes, no los 6.
- Matar el preview: `pkill -f "[v]ite preview"` no matchea el cmdline real (`…/vite.js preview`); usar `pkill -f "[v]ite.js preview"` o matar por pid/puerto. Si la cmdline propia contiene el patrón literal, el `pkill` mata el propio shell.
- Un preview viejo en 4173 provoca `Port 4173 is already in use` al arrancar otro: libera el puerto antes de revalidar.
- `tsc -b` **no** cubre `scripts/e2e/**` (los tsconfigs solo incluyen `src` y los configs): tipar los specs con `npx tsc --noEmit --ignoreConfig --strict --skipLibCheck --lib ES2023,DOM --module esnext --moduleResolution bundler scripts/e2e/*.ts` antes de darlos por buenos.
- La emulación táctil de Playwright (`hasTouch`) da `matchMedia('(hover: hover)') === false` → el guard CSS de RF-8 es real y está verificado en e2e; el tooltip en táctil se cubre por teclado (Tab hasta la última celda) para el RNF de desbordamiento.
- Validar rótulos de mes por **índice** (`ene…dic` → 0-11) y no por string: ICU da «sept» pero otra versión de CLDR podría dar «sep»; un test que compare strings rompe sin tocar código.

## Tras el cierre de la spec 001

- BLOQUEO 2026-10-10 (resuelto): los subagentes (@planner/@reviewer) no arrancaban con el tier gratuito; el flujo se reanudó sin ellos. Ninguna spec 002 sigue pendiente: la de minutos/racha se descartó.

1. Rama **`develop`**, sin remoto (ojo: antes `MEMORY.md` decía `main`; corregir si cambia). El hook pre-commit ejecuta `validate`, así que un commit con la suite rota es imposible; **`npm run e2e` no lo cubre**, hay que acordarse de lanzarlo a mano.
2. Cualquier requisito nuevo va primero a una spec (`specs/002-…/`) y después a código: la spec manda (Constitución 2). La siguiente sería `specs/002-…/` otra vez, pero **solo racha** si se retoma.
3. Proceso habitual: una tarea cada vez — rojo → verde → `npm run validate` → marcar casilla → parar (y esperar «dale»).
