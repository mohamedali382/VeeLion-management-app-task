import type { Task } from "@/types/api";

type TaskItemProps = {
  task: Task;
  busy: boolean;
  error?: string;
  onToggle: (task: Task) => void;
  onRetry: (task: Task) => void;
};

export function TaskItem({ task, busy, error, onToggle, onRetry }: TaskItemProps) {
  return (
    <li className="card task-item">
      <div className="task-item-heading">
        <p className="task-item-title">{task.title}</p>
        <span className="badge">{task.completed ? "Completed" : "Pending"}</span>
      </div>

      <small className="muted-text">
        Updated: {new Date(task.updatedAt).toLocaleString()}
      </small>

      <div className="task-action-row">
        <button
          type="button"
          className="button"
          onClick={() => onToggle(task)}
          disabled={busy}
          aria-label={`Mark ${task.title} as ${task.completed ? "pending" : "completed"}`}
          aria-live="polite"
        >
          {busy ? "Saving..." : task.completed ? "Mark as Pending" : "Mark as Completed"}
        </button>
      </div>
      {error ? (
        <div className="task-item-error" role="alert">
          <p>{error}</p>
          <button type="button" className="button" onClick={() => onRetry(task)} disabled={busy}>
            Retry update
          </button>
        </div>
      ) : null}
    </li>
  );
}
