import { useEffect, useRef } from 'react';

/**
 * Comportamiento común de los diálogos del feature:
 * cierre con Escape, bloqueo del scroll del body mientras están abiertos
 * y devolución del foco al elemento que los abrió (RF-7, spec 001).
 */
export function useDialog(onClose: () => void) {
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    // La hoja no roba el foco: al montar sigue en el elemento que la abrió.
    const active = document.activeElement;
    const trigger = active instanceof HTMLElement && active !== document.body ? active : null;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current();
    };
    document.addEventListener('keydown', handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      // Tras un clic en la X o en el fondo el foco se pierde al desmontar
      // el diálogo; se restaura al disparador si sigue en el documento.
      if (trigger?.isConnected) trigger.focus();
    };
  }, []);
}
