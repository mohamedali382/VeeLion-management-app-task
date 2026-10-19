import type { Task } from "@/types/api";
import { TaskItem } from "@/components/tasks/TaskItem";

type TaskListProps = {
  tasks: Task[];
  totalTasksCount: number;
  updatingTaskIds: Set<string>;
  updateErrors: Record<string, string>;
  onToggle: (task: Task) => void;
  onRetry: (task: Task) => void;
};

export function TaskList({
  tasks,
  totalTasksCount,
  updatingTaskIds,
  updateErrors,
  onToggle,
  onRetry,
}: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <section className="card empty-state">
        <p>{totalTasksCount === 0 ? "No tasks yet." : "No tasks match this filter."}</p>
      </section>
    );
  }

  return (
    <section aria-label="Task list">
      <ul className="task-list">
        {tasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            busy={updatingTaskIds.has(task.id)}
            error={updateErrors[task.id]}
            onToggle={onToggle}
            onRetry={onRetry}
          />
        ))}
      </ul>
    </section>
  );
}
