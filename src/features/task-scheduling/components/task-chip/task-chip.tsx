import type { CSSProperties, MouseEvent } from 'react';
import { useDraggable } from '@dnd-kit/core';
import type { Task } from '../../models';
import { STATUS_META } from '../../models';
import { CheckIcon, ClockIcon } from '../icons/icons';
import './task-chip.css';

interface TaskChipProps {
  task: Task;
  /** Abre el formulario de edición. Ausente en el overlay de arrastre. */
  onOpen?: (task: Task) => void;
  /** Renderiza la copia flotante que sigue al puntero durante el drag. */
  isOverlay?: boolean;
}

/**
 * Tarea draggable: se usa en las celdas del calendario y en la bandeja
 * (dos consumidores dentro del mismo feature → componente local).
 */
export default function TaskChip({ task, onOpen, isOverlay = false }: TaskChipProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    data: { type: 'task', task },
  });

  const meta = STATUS_META[task.status];
  const style = { '--chip-color': meta.color, '--chip-soft': meta.soft } as CSSProperties;

  const className = [
    'task-chip',
    `task-chip--${task.status}`,
    isOverlay ? 'task-chip--overlay' : '',
    !isOverlay && isDragging ? 'is-dragging' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const content = (
    <>
      {task.time !== null ? (
        <span className="chip-time">
          <ClockIcon />
          {task.time}
        </span>
      ) : (
        <span className="chip-time chip-time--all-day">Día</span>
      )}
      <span className="chip-title">
        {task.status === 'completed' && <CheckIcon className="chip-check" />}
        {task.title}
      </span>
    </>
  );

  if (isOverlay) {
    return (
      <div className={className} style={style} data-task-id={task.id} data-status={task.status}>
        {content}
      </div>
    );
  }

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onOpen?.(task);
  };

  return (
    <button
      type="button"
      ref={setNodeRef}
      className={className}
      style={style}
      data-task-id={task.id}
      data-status={task.status}
      onClick={handleClick}
      {...attributes}
      {...listeners}
    >
      {content}
    </button>
  );
}
