import { useCallback, useMemo, useRef, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import type { Task, TaskFilters, TaskInput } from './models';
import { useTasks } from './hooks/use-tasks';
import { useMediaQuery } from './hooks/use-media-query';
import { addMonths, formatMonthTitle, startOfMonth, todayISO } from './utils/date-utils';
import { compareForTray, countByStatus, filterTasks, groupTasksByDate } from './utils/task-query';
import { heatMapModel } from './utils/heat-map';
import CalendarMonth from './components/calendar-month/calendar-month';
import TaskTray from './components/task-tray/task-tray';
import TaskFiltersBar from './components/task-filters/task-filters';
import TaskFormModal from './components/task-form/task-form-modal';
import DayTasksSheet from './components/day-sheet/day-tasks-sheet';
import HeatMap from './components/heat-map/heat-map';
import TaskChip from './components/task-chip/task-chip';
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
} from './components/icons/icons';
import './task-scheduling.css';

type ModalState = { mode: 'create'; date: string | null } | { mode: 'edit'; task: Task } | null;

/**
 * Contenedor principal del feature: su nombre coincide con el feature
 * (Screaming Architecture). Aquí vive el estado de UI (mes visible,
 * filtros, diálogos) y la orquestación del drag & drop; el estado de
 * tareas y su persistencia los aporta `useTasks`.
 */
export default function TaskScheduling() {
  const { tasks, storageOk, createTask, updateTask, deleteTask, moveTask } = useTasks();

  const [filters, setFilters] = useState<TaskFilters>({ status: 'all', query: '' });
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(new Date()));
  const [modal, setModal] = useState<ModalState>(null);
  const [openDay, setOpenDay] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  // Tras un arrastre, el click sintético del navegador no debe abrir diálogos.
  const lastDragEndAt = useRef(0);

  const isCompact = useMediaQuery('(max-width: 900px)');
  const maxVisibleTasks = isCompact ? 2 : 4;

  const visibleTasks = useMemo(() => filterTasks(tasks, filters), [tasks, filters]);
  const tasksByDay = useMemo(() => groupTasksByDate(visibleTasks), [visibleTasks]);
  const trayTasks = useMemo(
    () => visibleTasks.filter((task) => task.date === null).sort(compareForTray),
    [visibleTasks],
  );
  const statusCounts = useMemo(() => countByStatus(tasks), [tasks]);

  // Mapa de calor (spec 001): `hoy` fijo por montaje, sin recalcular a
  // medianoche. RF-6: se pasa la lista global `tasks`, nunca `visibleTasks`.
  const hoy = useMemo(() => new Date(), []);
  // RF-11: almacén ilegible y sin tareas válidas en memoria → la rejilla se
  // pinta en color cero con su leyenda y sin el texto de RF-9.
  const sinDatos = !storageOk && tasks.length === 0;
  const heatModel = useMemo(() => heatMapModel(tasks, hoy, sinDatos), [tasks, hoy, sinDatos]);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    // En táctil: pulsación larga de 250 ms para arrastrar, el resto sigue
    // siendo scroll normal de la página.
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
  );

  const openCreate = useCallback((date: string | null) => {
    setModal({ mode: 'create', date });
  }, []);

  const openEdit = useCallback((task: Task) => {
    setModal({ mode: 'edit', task });
  }, []);

  const isDragClick = () => Date.now() - lastDragEndAt.current < 350;

  // «Octubre 2026» → mes como titular, año recogido a su lado (ver .month-title).
  const fullMonthTitle = formatMonthTitle(visibleMonth);
  const titleSplit = fullMonthTitle.lastIndexOf(' ');
  const monthName = fullMonthTitle.slice(0, titleSplit);
  const monthYear = fullMonthTitle.slice(titleSplit + 1);

  const handleDayBackgroundClick = (date: string) => {
    if (isDragClick()) return;
    openCreate(date);
  };

  const handleTaskOpen = (task: Task) => {
    if (isDragClick()) return;
    openEdit(task);
  };

  const handleSave = (input: TaskInput) => {
    if (modal?.mode === 'edit') updateTask(modal.task.id, input);
    else createTask(input);
    setModal(null);
  };

  const handleDelete = () => {
    if (modal?.mode === 'edit') deleteTask(modal.task.id);
    setModal(null);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const task = event.active.data.current?.task;
    if (task) setActiveTask(task as Task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    lastDragEndAt.current = Date.now();
    setActiveTask(null);

    const { active, over } = event;
    if (!over) return;

    const overId = String(over.id);
    if (overId === 'tray') {
      moveTask(String(active.id), null);
    } else if (overId.startsWith('day:')) {
      moveTask(String(active.id), overId.slice('day:'.length));
    }
  };

  const handleDragCancel = () => {
    lastDragEndAt.current = Date.now();
    setActiveTask(null);
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className={`task-scheduling${activeTask ? ' is-dragging' : ''}`}>
        <header className="app-header">
          <div className="brand">
            <span className="brand-mark" aria-hidden="true">
              <CalendarIcon />
            </span>
            <div className="brand-text">
              <h1 className="brand-title">MyTasksCalendar</h1>
              <p className="brand-subtitle">Organizador de tareas por fechas</p>
            </div>
          </div>

          <div className="app-header-actions">
            {!storageOk && (
              <span className="storage-warning" role="status">
                Guardado local no disponible
              </span>
            )}
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => openCreate(todayISO())}
            >
              <PlusIcon />
              Nueva tarea
            </button>
          </div>
        </header>

        <div className="app-toolbar">
          <div className="month-nav">
            <button
              type="button"
              className="icon-btn"
              aria-label="Mes anterior"
              onClick={() => setVisibleMonth((month) => addMonths(month, -1))}
            >
              <ChevronLeftIcon />
            </button>
            <h2 className="month-title" aria-live="polite">
              {monthName} <span className="month-year">{monthYear}</span>
            </h2>
            <button
              type="button"
              className="icon-btn"
              aria-label="Mes siguiente"
              onClick={() => setVisibleMonth((month) => addMonths(month, 1))}
            >
              <ChevronRightIcon />
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-small"
              onClick={() => setVisibleMonth(startOfMonth(new Date()))}
            >
              Hoy
            </button>
          </div>

          <TaskFiltersBar
            filters={filters}
            counts={statusCounts}
            total={tasks.length}
            onChange={setFilters}
          />
        </div>

        <main className="app-layout">
          <section className="calendar-panel" aria-label="Calendario mensual">
            <CalendarMonth
              month={visibleMonth}
              tasksByDay={tasksByDay}
              maxVisibleTasks={maxVisibleTasks}
              onDayBackgroundClick={handleDayBackgroundClick}
              onDayOpen={setOpenDay}
              onTaskOpen={handleTaskOpen}
            />
          </section>

          <aside className="tray-panel" aria-label="Tareas pendientes de fecha">
            <TaskTray
              tasks={trayTasks}
              onTaskOpen={handleTaskOpen}
              onNew={() => openCreate(null)}
            />
          </aside>
        </main>

        {/* RF-7: la celda abre la Hoja del día; al cerrarla, el foco vuelve
            a la celda (lo restaura useDialog al desmontar). */}
        <div className="heat-map-section">
          <HeatMap model={heatModel} onDayOpen={setOpenDay} />
        </div>

        {openDay !== null && (
          <DayTasksSheet
            date={openDay}
            tasks={tasksByDay.get(openDay) ?? []}
            onClose={() => setOpenDay(null)}
            onTaskOpen={(task) => {
              setOpenDay(null);
              openEdit(task);
            }}
            onAdd={() => {
              setOpenDay(null);
              openCreate(openDay);
            }}
          />
        )}

        {modal !== null && (
          <TaskFormModal
            mode={modal.mode}
            task={modal.mode === 'edit' ? modal.task : null}
            initialDate={modal.mode === 'create' ? modal.date : undefined}
            onSave={handleSave}
            onDelete={modal.mode === 'edit' ? handleDelete : undefined}
            onCancel={() => setModal(null)}
          />
        )}

        <DragOverlay dropAnimation={{ duration: 180, easing: 'ease-out' }}>
          {activeTask ? <TaskChip task={activeTask} isOverlay /> : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
}
