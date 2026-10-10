# shared/ · Código compartido entre features

**Scope Rule (sin excepciones):** aquí solo entra código que consuman **2 o más features**.

- 1 feature → se queda en `src/features/<feature>/…`
- 2+ features → se mueve a `src/shared/…`

Hoy la aplicación tiene un único feature (`task-scheduling`), por lo que este
directorio está vacío a propósito. El siguiente componente que necesite una
segunda feature debe migrarse aquí en ese momento, no antes (ni por
«anticipación»): empezar local y extraer cuando el uso real lo confirme.
