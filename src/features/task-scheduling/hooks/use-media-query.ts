import { useCallback, useSyncExternalStore } from 'react';

/**
 * Sincroniza un Media Query de CSS con React usando el patrón de
 * suscripción de `useSyncExternalStore` (sin efectos que fuercen renders).
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mediaQuery = window.matchMedia(query);
      mediaQuery.addEventListener('change', onChange);
      return () => mediaQuery.removeEventListener('change', onChange);
    },
    [query],
  );

  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query]);

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
