import TaskScheduling from '@features/task-scheduling/task-scheduling';

/**
 * Shell de la aplicación. El peso funcional vive en el feature
 * `task-scheduling`; aquí solo se compone.
 */
export default function App() {
  return <TaskScheduling />;
}
