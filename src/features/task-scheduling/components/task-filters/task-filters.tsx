import type { CSSProperties } from 'react';
import type { StatusFilter, TaskFilters, TaskStatus } from '../../models';
import { STATUS_FILTER_LABELS, STATUS_META, TASK_STATUSES } from '../../models';
import { SearchIcon } from '../icons/icons';
import './task-filters.css';

interface TaskFiltersBarProps {
  filters: TaskFilters;
  /** Totales por estado (sin aplicar filtros) para mostrar los contadores. */
  counts: Record<TaskStatus, number>;
  total: number;
  onChange: (filters: TaskFilters) => void;
}

type Option = { value: StatusFilter; label: string; color?: string; count: number };

/**
 * Filtros por estado (con contadores, hacen de leyenda de colores)
 * y búsqueda por texto.
 */
export default function TaskFiltersBar({ filters, counts, total, onChange }: TaskFiltersBarProps) {
  const options: Option[] = [
    { value: 'all', label: STATUS_FILTER_LABELS.all, count: total },
    ...TASK_STATUSES.map((status) => ({
      value: status as StatusFilter,
      label: STATUS_FILTER_LABELS[status],
      color: STATUS_META[status].color,
      count: counts[status],
    })),
  ];

  return (
    <div className="filters-bar">
      <div className="filter-chips" role="group" aria-label="Filtrar por estado">
        {options.map((option) => {
          const isActive = filters.status === option.value;
          return (
            <button
              key={option.value}
              type="button"
              className={`filter-chip${isActive ? ' is-active' : ''}`}
              style={option.color ? ({ '--dot': option.color } as CSSProperties) : undefined}
              aria-pressed={isActive}
              onClick={() => onChange({ ...filters, status: option.value })}
            >
              {option.color && <span className="filter-dot" aria-hidden="true" />}
              {option.label}
              <span className="filter-count">{option.count}</span>
            </button>
          );
        })}
      </div>

      <label className="search-field">
        <SearchIcon className="search-icon" />
        <input
          type="search"
          className="search-input"
          placeholder="Buscar tarea…"
          value={filters.query}
          onChange={(event) => onChange({ ...filters, query: event.target.value })}
          aria-label="Buscar tareas"
        />
      </label>
    </div>
  );
}
