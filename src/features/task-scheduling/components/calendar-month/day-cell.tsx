import type { MouseEvent } from 'react';
import { useDroppable } from '@dnd-kit/core';
import type { Task } from '../../models';
import { formatFullDate, isWeekend } from '../../utils/date-utils';
import TaskChip from '../task-chip/task-chip';
import './day-cell.css';

interface DayCellProps {
  date: Date;
  iso: string;
  isCurrentMonth: boolean;
  isTodayCell: boolean;
  tasks: Task[];
  maxVisible: number;
  onBackgroundClick: (date: string) => void;
  onOpenDay: (date: string) => void;
  onTaskOpen: (task: Task) => void;
}

/**
 * Celda del calendario: es a la vez target de arrastre (droppable) y
 * superficie de creación con click en el fondo.
 */
export default function DayCell({
  date,
  iso,
  isCurrentMonth,
  isTodayCell,
  tasks,
  maxVisible,
  onBackgroundClick,
  onOpenDay,
  onTaskOpen,
}: DayCellProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `day:${iso}`,
    data: { type: 'day', date: iso },
  });

  const visible = tasks.slice(0, maxVisible);
  const hidden = tasks.length - visible.length;

  const className = [
    'day-cell',
    isCurrentMonth ? '' : 'is-outside',
    isWeekend(date) ? 'is-weekend' : '',
    isTodayCell ? 'is-today' : '',
    isOver ? 'is-over' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const handleBackgroundClick = () => onBackgroundClick(iso);

  const handleOpenDay = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onOpenDay(iso);
  };

  return (
    <div
      ref={setNodeRef}
      className={className}
      data-date={iso}
      data-testid="day-cell"
      onClick={handleBackgroundClick}
    >
      <div className="day-cell-head">
        <button
          type="button"
          className="day-number"
          onClick={handleOpenDay}
          aria-label={`Ver tareas de ${formatFullDate(iso)}`}
        >
          {date.getDate()}
        </button>
        {isTodayCell && <span className="today-badge">Hoy</span>}
        {tasks.length > 0 && !isTodayCell && (
          <span className="day-count" aria-hidden="true">
            {tasks.length}
          </span>
        )}
      </div>

      <div className="day-cell-tasks">
        {visible.map((task) => (
          <TaskChip key={task.id} task={task} onOpen={onTaskOpen} />
        ))}
        {hidden > 0 && (
          <button type="button" className="more-tasks" onClick={handleOpenDay}>
            +{hidden} más
          </button>
        )}
      </div>
    </div>
  );
}
