import { useDroppable } from '@dnd-kit/core';
import type { Task } from '../../models';
import TaskChip from '../task-chip/task-chip';
import { InboxIcon, PlusIcon } from '../icons/icons';
import './task-tray.css';

interface TaskTrayProps {
  tasks: Task[];
  onTaskOpen: (task: Task) => void;
  onNew: () => void;
}

/**
 * Bandeja de tareas pendientes de fecha: lista vertical y target de
 * arrastre para desprogramar una tarea.
 */
export default function TaskTray({ tasks, onTaskOpen, onNew }: TaskTrayProps) {
  const { setNodeRef, isOver } = useDroppable({ id: 'tray', data: { type: 'tray' } });

  return (
    <div
      ref={setNodeRef}
      className={`task-tray${isOver ? ' is-over' : ''}`}
      data-testid="task-tray"
    >
      <div className="tray-head">
        <div className="tray-heading">
          <h2 className="tray-title">Sin fecha</h2>
          <p className="tray-subtitle">Arrastra aquí las tareas pendientes de fecha</p>
        </div>
        <span className="tray-count" aria-label={`${tasks.length} tareas sin fecha`}>
          {tasks.length}
        </span>
      </div>

      <div className="tray-list">
        {tasks.length === 0 ? (
          <div className="tray-empty">
            <InboxIcon className="tray-empty-icon" />
            <p className="tray-empty-title">No hay tareas sin fecha</p>
            <p className="tray-empty-text">
              Crea una nueva o arrastra aquí una tarea del calendario para quitarle fecha.
            </p>
          </div>
        ) : (
          tasks.map((task) => <TaskChip key={task.id} task={task} onOpen={onTaskOpen} />)
        )}
      </div>

      <button type="button" className="btn btn-secondary btn-block" onClick={onNew}>
        <PlusIcon />
        Nueva sin fecha
      </button>
    </div>
  );
}
