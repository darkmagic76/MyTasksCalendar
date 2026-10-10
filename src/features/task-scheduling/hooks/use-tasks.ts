import { useCallback, useEffect, useState } from 'react';
import type { Task, TaskInput } from '../models';
import { taskStorage } from '../services/task-storage';

function applyInput(task: Task, input: TaskInput): Task {
  const now = new Date().toISOString();
  return {
    ...task,
    title: input.title.trim(),
    description: input.description?.trim() || null,
    date: input.date ?? null,
    time: input.time ?? null,
    status: input.status ?? task.status,
    updatedAt: now,
  };
}

/**
 * Estado de tareas + mutaciones + guardado automático en localStorage.
 * Contenedor lógico del feature: no renderiza nada.
 */
export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>(() => taskStorage.load());
  // Disponibilidad de localStorage: se comprueba una sola vez al montar.
  const [storageOk] = useState(() => taskStorage.isAvailable());

  // Guardado automático en cada cambio de la colección (sistema externo).
  useEffect(() => {
    taskStorage.save(tasks);
  }, [tasks]);

  const createTask = useCallback((input: TaskInput): Task => {
    const now = new Date().toISOString();
    const task: Task = {
      id: crypto.randomUUID(),
      title: input.title.trim(),
      description: input.description?.trim() || null,
      date: input.date ?? null,
      time: input.time ?? null,
      status: input.status ?? 'pending',
      createdAt: now,
      updatedAt: now,
    };
    setTasks((previous) => [...previous, task]);
    return task;
  }, []);

  const updateTask = useCallback((id: string, input: TaskInput) => {
    setTasks((previous) =>
      previous.map((task) => (task.id === id ? applyInput(task, input) : task)),
    );
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks((previous) => previous.filter((task) => task.id !== id));
  }, []);

  /** Mueve una tarea a un día concreto (o a la bandeja con `null`). */
  const moveTask = useCallback((id: string, date: string | null) => {
    setTasks((previous) =>
      previous.map((task) =>
        task.id === id && task.date !== date
          ? { ...task, date, updatedAt: new Date().toISOString() }
          : task,
      ),
    );
  }, []);

  const setTaskStatus = useCallback((id: string, status: Task['status']) => {
    setTasks((previous) =>
      previous.map((task) =>
        task.id === id && task.status !== status
          ? { ...task, status, updatedAt: new Date().toISOString() }
          : task,
      ),
    );
  }, []);

  return {
    tasks,
    storageOk,
    createTask,
    updateTask,
    deleteTask,
    moveTask,
    setTaskStatus,
  };
}
