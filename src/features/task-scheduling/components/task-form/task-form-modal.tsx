import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, FormEvent } from 'react';
import type { Task, TaskInput, TaskStatus } from '../../models';
import { STATUS_META, TASK_STATUSES } from '../../models';
import { useDialog } from '../../hooks/use-dialog';
import { CloseIcon } from '../icons/icons';
import './task-form.css';

interface TaskFormModalProps {
  mode: 'create' | 'edit';
  /** Tarea a editar; null en modo creación. */
  task: Task | null;
  /** Fecha precargada en modo creación (null → bandeja). */
  initialDate?: string | null;
  onSave: (input: TaskInput) => void;
  onDelete?: () => void;
  onCancel: () => void;
}

/** Diálogo de creación y edición de tareas. */
export default function TaskFormModal({
  mode,
  task,
  initialDate,
  onSave,
  onDelete,
  onCancel,
}: TaskFormModalProps) {
  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [date, setDate] = useState(task?.date ?? initialDate ?? '');
  const [time, setTime] = useState(task?.time ?? '');
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? 'pending');
  const [submitted, setSubmitted] = useState(false);

  const titleRef = useRef<HTMLInputElement>(null);
  useDialog(onCancel);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  const isValid = title.trim().length > 0;
  const showError = submitted && !isValid;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
    if (!isValid) return;
    onSave({
      title: title.trim(),
      description: description.trim() || null,
      date: date || null,
      time: time || null,
      status,
    });
  };

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        // Igual que la Hoja del día: sin foco por defecto al pulsar el
        // fondo, el cierre devuelve el foco al elemento que lo abrió.
        event.preventDefault();
        onCancel();
      }}
    >
      <div
        className="modal modal--form"
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-form-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <form onSubmit={handleSubmit} noValidate>
          <header className="modal-head">
            <div>
              <h2 id="task-form-title" className="modal-title">
                {mode === 'edit' ? 'Editar tarea' : 'Nueva tarea'}
              </h2>
              <p className="modal-subtitle">
                {mode === 'edit'
                  ? 'Actualiza los detalles, la fecha y el estado'
                  : 'Añade una tarea a tu calendario'}
              </p>
            </div>
            <button type="button" className="icon-btn" aria-label="Cerrar" onClick={onCancel}>
              <CloseIcon />
            </button>
          </header>

          <div className="modal-body">
            <div className="field">
              <label htmlFor="task-title">
                Título <span className="required-mark">*</span>
              </label>
              <input
                id="task-title"
                ref={titleRef}
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Ej. Preparar informe semanal"
                maxLength={120}
                autoComplete="off"
                aria-invalid={showError}
                aria-describedby={showError ? 'task-title-error' : undefined}
              />
              {showError && (
                <span id="task-title-error" className="field-error">
                  El título es obligatorio.
                </span>
              )}
            </div>

            <div className="field">
              <label htmlFor="task-description">Descripción</label>
              <textarea
                id="task-description"
                rows={3}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Notas, enlaces o detalles…"
                maxLength={500}
              />
            </div>

            <div className="field-row">
              <div className="field">
                <label htmlFor="task-date">Fecha</label>
                <input
                  id="task-date"
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="task-time">Hora</label>
                <input
                  id="task-time"
                  type="time"
                  value={time}
                  onChange={(event) => setTime(event.target.value)}
                />
              </div>
            </div>

            {date === '' && (
              <p className="field-hint">
                Sin fecha: la tarea se guardará en la bandeja <strong>Sin fecha</strong>.
              </p>
            )}

            <fieldset className="field field--status">
              <legend>Estado</legend>
              <div className="status-segment" role="group" aria-label="Estado de la tarea">
                {TASK_STATUSES.map((value) => {
                  const meta = STATUS_META[value];
                  const isActive = status === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      className={`seg-btn${isActive ? ' is-active' : ''}`}
                      style={{ '--seg': meta.color, '--seg-soft': meta.soft } as CSSProperties}
                      aria-pressed={isActive}
                      onClick={() => setStatus(value)}
                    >
                      <span className="seg-dot" aria-hidden="true" />
                      {meta.label}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          </div>

          <footer className="modal-foot">
            <div className="modal-foot-start">
              {mode === 'edit' && onDelete && (
                <button
                  type="button"
                  className="btn btn-danger-text"
                  onClick={() => {
                    if (window.confirm('¿Eliminar esta tarea? Esta acción no se puede deshacer.')) {
                      onDelete();
                    }
                  }}
                >
                  Eliminar
                </button>
              )}
            </div>
            <div className="modal-foot-end">
              <button type="button" className="btn btn-ghost" onClick={onCancel}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                {mode === 'edit' ? 'Guardar cambios' : 'Crear tarea'}
              </button>
            </div>
          </footer>
        </form>
      </div>
    </div>
  );
}
