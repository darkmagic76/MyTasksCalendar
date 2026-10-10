# Plan 002

## Archivos (todo en task-scheduling, Scope Rule)
- models.ts (RF-3): += completedDate/Time/minutes.
- utils/tiempo.ts (RF-3, RF-5): ahoraHM, minutosEntre, rachaActual.
- date-utils.ts (RF-1): reutiliza toISODate/fromISODate/todayISO.
- use-tasks + storage (RF-3): normaliza a null.
- task-form-modal (RF-1–RF-4) y task-scheduling header (RF-5).

## Funciones puras (hoy como parámetro)
- minutosEntre(iFecha,iHora,fFecha,fHora): number.
- rachaActual(fechasISO[], hoyISO): number.

## Pseudocódigo
alCompletar: fin=ahora local; m=minutosEntre(...); si m<=0 error; si no guarda.
racha=rachaActual(completadas.map(completedDate), hoyISO).

## Interfaz
- Inicio date+time existentes; minutos readonly; cabecera p aria-live.

## Decisiones
- Título obligatorio y descripción opcional (no romper e2e). Descartado obligar descripción.
- Fin auto no editable (menos UI). Descartado editable.
- floor y 00:00 por defecto. Descartado ceil (convierte 0 en 1).
- Racha por fin, hueco de hoy permitido. Descartado por inicio.

## Tests
- vitest tiempo.test.ts + racha.test.ts; e2e cabecera y formulario.
