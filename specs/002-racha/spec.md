# Spec 002 — Registro con minutos y racha actual
Estado: aprobada

## Contexto y objetivo
El calendario permite crear tareas con fecha opcional, pero no registra cuánto se dedicó ni motiva con continuidad. Esta spec añade inicio/fin con minutos y una racha actual en cabecera, con los datos que la app ya tiene.

## Usuarios
- Persona que organiza sus tareas en su navegador.

## Historias de usuario
- HU-1. Como usuario, quiero registrar inicio y fin de una tarea para saber cuánto me llevó.
- HU-2. Como usuario, quiero ver mi racha actual de días seguidos completando en la cabecera para motivarme.

## Definiciones
- Día: fecha `YYYY-MM-DD` en hora local del usuario.
- Racha actual: días naturales consecutivos con ≥1 completada, contados hacia atrás desde hoy.

## Requisitos funcionales
- RF-1: CUANDO se abre `Nueva tarea`, EL SISTEMA precarga Fecha inicio con hoy local editable y vaciable (vacío → bandeja `Sin fecha`).
- RF-2: SI el título está vacío, ENTONCES EL SISTEMA no guarda y muestra `El título es obligatorio.`
- RF-3: CUANDO se marca una tarea como Completada, EL SISTEMA fija Fecha fin con ahora local, calcula `minutos = floor((fin - inicio) / 60000)` (inicio sin hora = 00:00 local) y guarda fin + minutos.
- RF-4: SI `minutos <= 0` al completar, ENTONCES EL SISTEMA no completa y muestra aviso en español.
- RF-5: EL SISTEMA muestra en cabecera `Racha actual: 0 días / 1 día / N días` con `aria-live`.
- RF-6: CUANDO existe `completedDate` dentro del día, EL SISTEMA la cuenta para la racha; las fechas futuras se ignoran y no rompen.

## Requisitos no funcionales
- Español en UI y errores; sin dependencias nuevas; misma clave `mytaskscalendar.tasks.v1` con normalización (viejas → null).
- Fechas locales: `toISODate/fromISODate`, `setDate(±1)`, nunca `new Date("AAAA-MM-DD")`, `toISOString()` ni `86400000` para sumar días.
- Sin scroll horizontal en 390 y 1440.

## Casos límite
- Inicio sin hora = 00:00 local; fin anterior/igual → no completa.
- 00:30, DST marzo/octubre, semana/mes/año a caballo.
- Volver a Pendiente/En curso o borrar la tarea que sostenía la racha recalcula.
- Almacén ilegible: racha 0, no bloquea.
- Medianoche cruzada: `hoy` congelado por montaje como el mapa.

## Fuera de alcance
- Descripción obligatoria, meta editable N, mejor racha, resumen mensual, proyectos, servidor.

## Criterios de finalización
- `npm run validate` y `npm run e2e` en verde, `git diff package.json` vacío, e2e actualizado al nuevo literal.

## Dudas abiertas
- Ninguna.