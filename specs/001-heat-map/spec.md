# Spec 001 — Mapa de calor de actividad

Estado: implementada (QA y clarificación cerrados: 0 dudas abiertas; 10/10 tareas)

## Contexto y objetivo

El calendario responde «¿qué hago hoy y este mes?», pero no «¿cómo ha ido mi ritmo en las últimas semanas?». Un mapa de calor tipo GitHub con las últimas 12 semanas —donde los días con más tareas Completadas se pintan más intensos— permite reconocer de un vistazo los días más productivos y detectar semanas flojas. Merece la pena porque responde esa pregunta con los datos que la app ya tiene, sin pedirle nada nuevo al usuario.

## Usuarios / actores

- Persona que organiza sus tareas en el calendario (uso individual, en su navegador).
- Persona nueva sin datos aún, que debe entender la función aunque esté vacía.

## Historias de usuario

- H1: Como usuario, quiero ver un mapa de las últimas 12 semanas donde los días con más tareas completadas se vean más intensos, para reconocer mis días productivos sin revisar mes a mes.
- H2: Como usuario, quiero pulsar un día del mapa y abrir su Hoja del día, para ver el detalle sin buscarlo en el calendario.
- H3: Como usuario, quiero ver al pasar el cursor la fecha y cuántas tareas completé ese día, para saber el conteo exacto sin salir del mapa.
- H4: Como usuario sin datos, quiero ver el mapa con una frase que explique qué representa, para entender la función antes de usarla.

## Requisitos funcionales (criterios de aceptación en EARS)

- RF-1: EL SISTEMA muestra 12 columnas (las últimas 12 semanas del calendario, incluida la semana en curso, alineadas al lunes) × 7 filas de día (lunes primero), donde la primera columna es siempre una semana completa, la última contiene solo los días transcurridos hasta hoy y no se muestran días futuros (total visible de 78 a 84 celdas según el día de la semana); bajo la primera columna de cada mes aparece su abreviatura en español en minúsculas («oct», «nov»); el mapa es independiente del mes que muestre el calendario.
- RF-2: CUANDO un día de la ventana contiene tareas con estado «Completada», EL SISTEMA aplica la escala fija: 1 completada = nivel 1; 2–3 = nivel 2; 4–5 = nivel 3; 6 o más = nivel 4.
- RF-3: CUANDO un día tiene tareas pendientes o en curso pero ninguna completada, EL SISTEMA lo pinta en nivel 0 (tono tenue de actividad), diferenciable de un día sin actividad.
- RF-4: CUANDO un día de la ventana no tiene ninguna tarea, EL SISTEMA lo pinta en color cero (sin actividad).
- RF-5: EL SISTEMA cuenta cada tarea en el día de su fecha y según su estado actual; las tareas sin fecha (bandeja «Sin fecha») no cuentan en ningún día.
- RF-6: MIENTRAS el usuario tenga filtros de estado o una búsqueda activos, EL SISTEMA mantiene en el mapa el conteo global sin filtrar.
- RF-7: CUANDO el usuario pulsa (ratón, táctil o teclado) una celda del mapa, tenga o no tareas, EL SISTEMA abre la Hoja del día de esa fecha con el mismo comportamiento que desde el calendario; el mapa no ofrece gesto de creación y, al cerrar la hoja, el foco vuelve a la celda pulsada.
- RF-8: CUANDO el usuario posa el cursor sobre una celda en escritorio, EL SISTEMA muestra un tooltip con «<fecha larga en español> · N completadas» (p. ej. «jueves, 8 de octubre de 2026 · 3 completadas»), que en días con actividad sin completar añade «· M sin completar», y que desaparece al retirar el cursor; en táctil no hay tooltip.
- RF-9: CUANDO la ventana no contiene ninguna tarea completada, EL SISTEMA muestra la rejilla, la leyenda y el texto «Todavía no has completado ninguna tarea con fecha en estas 12 semanas: marca una como completada», también cuando sí hay días con actividad en nivel 0.
- RF-10: EL SISTEMA muestra siempre visible una leyenda de 6 muestras (de color cero a nivel 4) con los extremos etiquetados «Menos» y «Más».
- RF-11: SI el almacén local no es legible y no hay tareas válidas en memoria, ENTONCES EL SISTEMA muestra la rejilla en color cero con su leyenda, sin el texto de RF-9, y no impide el uso del calendario.
- RF-12: EL SISTEMA realza visualmente la celda de hoy en el mapa, con el mismo criterio visual que la celda de hoy del calendario.
- RF-13: CUANDO el usuario navega con teclado hasta una celda, EL SISTEMA muestra foco visible y permite abrirla con Enter o Espacio; cada celda expone una etiqueta accesible con su fecha y su recuento de completadas, y el tooltip de RF-8 también aparece con el foco.

## Requisitos no funcionales

- Idioma: mapa, tooltip, leyenda, rótulos de mes y texto vacío en español (Constitución 6).
- Datos: funciona sin conexión, sin dependencias nuevas y sin crear claves de almacenamiento nuevas; todo se deriva de las tareas locales (Constituciones 1 y 5).
- Sin scroll horizontal en 390 px ni en 1440 px (verificable con el e2e de desbordamientos).
- El mapa refleja al instante, sin recargar y en la pestaña donde ocurre, cualquier cambio que altere los conteos: crear, editar, cambiar estado, cambiar fecha o borrar tareas.
- Accesibilidad e integridad visual: la intensidad por color no es la única vía de información (tooltip, hoja y etiqueta accesible dan el dato exacto); los 6 estados visuales usan valores de color distintos y ordenados por luminosidad (más actividad = menos luminosidad).

## Casos límite

- Tareas de todo el día (sin hora): cuentan igual que las con hora.
- Tarea sin fecha: no cuenta en ningún día; el texto de RF-9 sigue siendo cierto aunque existan completadas sin fecha.
- Cambiar la fecha de una tarea: el conteo pasa al nuevo día; el día anterior queda en color cero si queda vacío.
- Completar una tarea y volverla a pendiente: deja de contar (manda el estado actual, no el historial).
- Dos tareas con el mismo título, en días distintos: cuentan cada una en su día (no se deduplica).
- Semana en curso incompleta: la primera columna es siempre lunes completo; la última muestra solo 1 a 7 días según el día; los días futuros no se muestran.
- Arrastre sobre una celda del mapa: se ignora (el mapa no es zona de drop).
- Otra pestaña de la app abierta: los cambios no se reflejan en ella automáticamente.
- Tooltip visible cuando cambian los datos: el tooltip se cierra.
- Cambiar de mes en el calendario: el mapa no cambia (ventana anclada a hoy).
- Hoja abierta desde el mapa con fecha fuera del mes visible: se cierra sobre la celda sin navegar el calendario.
- Usuario con 0 tareas: se muestra RF-9.
- Cruzar medianoche: la ventana se determina al mostrarse/recalcularse; no se garantiza actualización automática sin interacción.
- Almacenamiento corrupto pero legible: se parte de las tareas ya normalizadas en memoria y el mapa usa lo que resulte (RF-9 si procede). Almacenamiento ilegible y sin datos en memoria: RF-11.

## Fuera de alcance

- Comparativas y tendencias («+10 % que la semana pasada»), gráficos de línea.
- Configurar el número de semanas, los umbrales o los colores de la escala.
- Filtrar o segmentar el mapa por estado o búsqueda (RF-6 lo niega explícitamente).
- Aceptar arrastres de tareas sobre el mapa.
- Reflejar cambios en otras pestañas abiertas.
- Exportar, imprimir o compartir el mapa.
- Historial de cambios de estado (auditoría): solo cuenta el estado actual.
- Mapa completo de 52 semanas tipo GitHub.
- Integrar el mapa dentro de las celdas del calendario mensual.
- Datos en servidor o sincronización entre dispositivos.

## Criterios de finalización

- Los 13 RF cubiertos por un test automatizado en verde: lógica pura (ventana, escala, conteos, filtros, estado vacío) con vitest; render e interacción (celdas, tooltip, teclado, click → hoja, leyenda, estado vacío) con Playwright.
- `npm run validate` completo en verde.
- `npm run e2e` en verde: los 12 tests existentes + los nuevos del mapa.
- Demo manual: completar tareas y ver cambiar la intensidad; abrir la hoja desde el mapa con ratón y con teclado; verificar estado vacío con datos nuevos; móvil a 390 px sin desbordamiento.
- `git diff package.json` vacío (sin dependencias nuevas).
- MEMORY.md actualizado al cerrar la fase.

## Dudas abiertas

- Ninguna: las tres dudas del borrador quedan resueltas en RF-1, RF-8 y RF-9 tras la revisión QA.
