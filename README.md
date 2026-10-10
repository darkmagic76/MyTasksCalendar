# MyTasksCalendar · Calendario de Tareas

Organizador de tareas de proyectos en un **calendario mensual**: crea tareas, arrástralas al día
concreto, asigna hora y estado, y filtra por lo que te interesa. Todo se guarda **automáticamente
en el navegador** (localStorage).

## Características

- **Calendario mensual** con navegación (mes anterior/siguiente, botón _Hoy_) y 6 semanas fijas.
- **Arrastrar y soltar** (@dnd-kit): de la bandeja a cualquier día, entre días o a la bandeja
  «Sin fecha». En táctil, pulsación larga de 250 ms para arrastrar (el resto sigue haciendo scroll).
- **Bandeja «Sin fecha»**: tareas pendientes de fecha, ordenadas por estado y recencia.
- **Formulario de creación/edición**: título (obligatorio), descripción, fecha, hora y estado.
  Click en el fondo de una celda = nueva tarea con esa fecha ya precargada.
- **Estados con color propio**: Pendiente (ámbar), En curso (azul), Completada (verde).
- **Ordenación automática**: dentro de cada día, primero las de todo el día y después por hora
  ascendente.
- **Filtros por estado con contadores** (hacen de leyenda de colores) y **búsqueda** por
  título/descripción.
- **Hoja del día**: al tocar el número del día o «+N más», lista completa con hora, título y estado.
- **Mapa de calor de actividad**: bajo el calendario, 12 semanas de tareas completadas con escala
  de 6 colores, tooltip por día y leyenda; pulsar una celda abre su Hoja del día.
- **Guardado automático** en localStorage tras cada cambio, con aviso si el navegador lo bloquea.
- **Diseño responsive** cuidado en escritorio (calendario + sidebar) y móvil (una columna,
  diálogos como hoja inferior, celdas compactas sin desbordamientos).

## Comandos

| Comando            | Descripción                                                   |
| ------------------ | ------------------------------------------------------------- |
| `npm run dev`      | Servidor de desarrollo (puerto 5173)                          |
| `npm run build`    | Typecheck + build de producción                               |
| `npm run preview`  | Sirve `dist/` (puerto 4173)                                   |
| `npm run validate` | ESLint + `tsc` + tests unitarios (pre-commit)                 |
| `npm run e2e`      | Tests Playwright: visual, DnD, mapa de calor, desbordamientos |
| `npm run format`   | Prettier                                                      |

> Los tests e2e usan el Chrome del sistema (`channel: 'chrome'`) porque esta plataforma
> (Ubuntu 20.04) no admite la descarga de Chromium incluida en Playwright.

## Arquitectura (Scope Rule + Screaming Architecture)

```
src/
  app/                       # Shell: App.tsx + estilos globales (tokens, botones, modales)
  features/
    task-scheduling/         # Único feature: el nombre del contenedor = el del feature
      task-scheduling.tsx    # Contenedor: estado de UI + orquestación DnD + diálogos
      models.ts              # Task, estados, metadatos de color
      components/            # Presentacionales (calendario, celdas, chips, bandeja,
                             #   filtros, formulario, hoja del día, mapa de calor, iconos)
      hooks/                 # useTasks, useMediaQuery, useDialog
      services/              # task-storage (validación/normalización) + seed
      utils/                 # Funciones puras de fecha y consulta (con tests)
  shared/                    # SOLO código usado por 2+ features (vacío a propósito)
  infrastructure/
    storage/                 # Adaptador genérico de localStorage (corte transversal)
```

**Decisiones de ubicación:**

1. `models`, `utils`, `hooks`, `components` → dentro de `task-scheduling`: solo los consume un
   feature (Scope Rule). Si una segunda feature necesita `Task`, se extraerá a `shared/`.
2. `infrastructure/storage` → técnico, sin semántica de negocio, reutilizable por cualquier
   feature futura (ajustes, sesión…): por eso no vive en el feature.
3. El contenedor se llama `task-scheduling` (igual que el feature) y los componentes son
   presentacionales puros que reciben props.

## Persistencia

- Clave `mytaskscalendar.tasks.v1` en localStorage.
- En el primer arranque se siembra una demo; a partir de ahí, cualquier guardado (incluida la
  lista vacía) evita volver a sembrar.
- Al cargar se **normaliza** cada tarea: una caché corrupta nunca rompe la app.

## Mapa de calor de actividad

Bajo el calendario, una rejilla de **12 semanas alineada al lunes que termina en hoy**
(entre 78 y 84 celdas, nunca con fechas futuras). Cada celda cuenta las tareas **con fecha**
de ese día —las sin fecha no cuentan— y pinta su nivel:

| Nivel   | Color                                   | Se pinta cuando                |
| ------- | --------------------------------------- | ------------------------------ |
| `cero`  | gris al 6 %                             | sin actividad ese día          |
| `0`     | violeta al 12 %                         | solo tareas sin completar      |
| `1`…`4` | violeta creciente (28 / 45 / 65 / 85 %) | 1 · 2–3 · 4–5 · 6+ completadas |

- **Tooltip**: «fecha larga · N completadas», más «· M sin completar» si las hay. Aparece al
  posar el cursor (solo escritorio; en táctil no) y también con el foco del teclado.
- **Leyenda** de 6 muestras («Menos ▪▪▪▪▪▪ Más»), siempre visible, con los mismos colores que
  la rejilla.
- **Invitación**: si la ventana no contiene ninguna tarea completada se muestra el texto
  «Todavía no has completado ninguna tarea con fecha en estas 12 semanas: marca una como
  completada».
- **Interacción**: clic (o `Enter`/`Espacio`) abre la Hoja del día de esa fecha y, al cerrarla,
  el foco vuelve a la celda. La celda de hoy lleva un anillo de marca.
- **Los filtros no le afectan**: el mapa cuenta siempre la lista global de tareas.
- Si el almacenamiento **no es legible** y no hay tareas en memoria, la rejilla se muestra toda
  en color cero con su leyenda y sin la invitación; el calendario sigue siendo usable.

Especificación completa en `specs/001-heat-map/`; la cubren 31 tests unitarios y 10 e2e
(`npm run validate` y `npm run e2e`).
