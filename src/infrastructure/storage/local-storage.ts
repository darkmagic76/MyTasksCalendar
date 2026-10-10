/**
 * Adaptador genérico de localStorage (corte transversal).
 *
 * Scope Rule: código técnico sin semántica de negocio, reutilizable por
 * cualquier feature futura (ajustes, autenticación…), por eso vive en
 * infrastructure/ y no dentro de un feature.
 */

export function readRaw(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch (error) {
    console.warn(`[storage] No se pudo leer "${key}"`, error);
    return null;
  }
}

export function writeRaw(key: string, value: string): boolean {
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.warn(`[storage] No se pudo guardar "${key}"`, error);
    return false;
  }
}

export function removeRaw(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    console.warn(`[storage] No se pudo eliminar "${key}"`, error);
  }
}
