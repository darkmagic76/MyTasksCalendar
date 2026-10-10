# Constitución · My Tasks Calendar

Proyecto educativo: todo cambio debe poder entenderse y mantenerse por quien empieza a programar. Lo que sigue es innegociable; cambiarlo exige aprobación explícita.

1. **Stack mínimo.** React + TypeScript + Vite y solo las dependencias ya instaladas. Añadir cualquiera nueva: solo con aprobación explícita.
2. **La spec manda.** Si no está en una spec aprobada de `specs/NNN-*/`, no se implementa. Un cambio de requisitos va primero a la spec, después al código.
3. **Lógica e interfaz separadas.** La lógica vive en funciones puras y hooks (`utils/`, `hooks/`, `services/`); los componentes son presentacionales con props, sin negocio dentro.
4. **Tests con lo ya instalado.** Sin dependencias nuevas de test: `npm run validate` (lint + tsc + vitest) y `npm run e2e` en verde antes de cada commit.
5. **Los datos del usuario no salen de su navegador.** Solo localStorage (clave `mytaskscalendar.tasks.v1`), nunca servidores; todo lo guardado se normaliza al cargar.
6. **Español en todo.** Código, comentarios, tests y textos de UI en español; cambiar un texto de UI implica actualizar el e2e que lo usa.
