import type { CSSProperties } from 'react';
import type { Task } from '../../models';
import { STATUS_META } from '../../models';
import { formatFullDate } from '../../utils/date-utils';
import { useDialog } from '../../hooks/use-dialog';
import { CloseIcon, PlusIcon } from '../icons/icons';
import './day-sheet.css';

interface DayTasksSheetProps {
  date: string;
  tasks: Task[];
  onClose: () => void;
  onTaskOpen: (task: Task) => void;
  onAdd: () => void;
}

/** Diálogo con todas las tareas de un día (accesible desde el número o «+N más»). */
export default function DayTasksSheet({
  date,
  tasks,
  onClose,
  onTaskOpen,
  onAdd,
}: DayTasksSheetProps) {
  useDialog(onClose);

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        // Cancela el foco por defecto del ratón: al cerrar desde el fondo,
        // el foco se queda (y vuelve) en la celda que abrió la hoja (RF-7).
        event.preventDefault();
        onClose();
      }}
    >
      <div
        className="modal modal--sheet"
        role="dialog"
        aria-modal="true"
        aria-label={`Tareas de ${formatFullDate(date)}`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="modal-head">
          <div>
            <p className="sheet-eyebrow">Tareas del día</p>
            <h2 className="modal-title">{formatFullDate(date)}</h2>
          </div>
          <button type="button" className="icon-btn" aria-label="Cerrar" onClick={onClose}>
            <CloseIcon />
          </button>
        </header>

        <div className="sheet-list">
          {tasks.length === 0 ? (
            <p className="sheet-empty">No hay tareas para este día. ¡Añade la primera!</p>
          ) : (
            tasks.map((task) => {
              const meta = STATUS_META[task.status];
              return (
                <button
                  key={task.id}
                  type="button"
                  className="sheet-row"
                  data-task-id={task.id}
                  data-status={task.status}
                  onClick={() => onTaskOpen(task)}
                >
                  <span className="sheet-row-time">{task.time ?? 'Todo el día'}</span>
                  <span className="sheet-row-title">{task.title}</span>
                  <span
                    className="sheet-row-status"
                    style={{ '--status': meta.color, '--status-soft': meta.soft } as CSSProperties}
                  >
                    {meta.label}
                  </span>
                </button>
              );
            })
          )}
        </div>

        <footer className="modal-foot">
          <button type="button" className="btn btn-primary btn-block" onClick={onAdd}>
            <PlusIcon />
            Añadir tarea en este día
          </button>
        </footer>
      </div>
    </div>
  );
}
