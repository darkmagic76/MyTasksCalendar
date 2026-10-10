import { useMemo } from 'react';
import type { Task } from '../../models';
import {
  formatWeekdayShort,
  isSameMonth,
  isToday,
  isWeekend,
  monthMatrix,
  toISODate,
} from '../../utils/date-utils';
import DayCell from './day-cell';
import './calendar-month.css';

interface CalendarMonthProps {
  month: Date;
  tasksByDay: Map<string, Task[]>;
  /** Cuántas tareas se muestran antes de colapsar en «+N más». */
  maxVisibleTasks: number;
  /** Click en el fondo de una celda → nueva tarea con esa fecha. */
  onDayBackgroundClick: (date: string) => void;
  /** Click en el número del día o en «+N más» → hoja con el día completo. */
  onDayOpen: (date: string) => void;
  onTaskOpen: (task: Task) => void;
}

export default function CalendarMonth({
  month,
  tasksByDay,
  maxVisibleTasks,
  onDayBackgroundClick,
  onDayOpen,
  onTaskOpen,
}: CalendarMonthProps) {
  const weeks = useMemo(() => monthMatrix(month), [month]);
  const weekdays = useMemo(() => (weeks[0] ?? []).map((date) => formatWeekdayShort(date)), [weeks]);
  const monthStart = month;

  return (
    <div className="calendar-month">
      <div className="weekday-row">
        {weekdays.map((label, index) => (
          <div key={label} className={`weekday${isWeekend(weeks[0][index]) ? ' is-weekend' : ''}`}>
            {label}
          </div>
        ))}
      </div>

      <div className="calendar-grid">
        {weeks.flat().map((date) => {
          const iso = toISODate(date);
          return (
            <DayCell
              key={iso}
              date={date}
              iso={iso}
              isCurrentMonth={isSameMonth(date, monthStart)}
              isTodayCell={isToday(date)}
              tasks={tasksByDay.get(iso) ?? []}
              maxVisible={maxVisibleTasks}
              onBackgroundClick={onDayBackgroundClick}
              onOpenDay={onDayOpen}
              onTaskOpen={onTaskOpen}
            />
          );
        })}
      </div>
    </div>
  );
}
