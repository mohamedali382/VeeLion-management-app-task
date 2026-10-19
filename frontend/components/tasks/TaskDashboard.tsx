"use client";

import { useTasks } from "@/hooks/useTasks";
import type { Task } from "@/types/api";
import { StatusFilter } from "@/components/tasks/StatusFilter";
import { TaskList } from "@/components/tasks/TaskList";

export function TaskDashboard() {
  const {
    filteredTasks,
    tasks,
    filter,
    loading,
    loadError,
    updateErrors,
    updatingTaskIds,
    setFilter,
    fetchTasks,
    updateTaskStatus,
  } = useTasks();

  const handleToggle = (task: Task) => {
    updateTaskStatus(task.id, !task.completed);
  };

  return (
    <section className="stack">
      <header className="card task-dashboard-header">
        <h1>Task Dashboard</h1>
      </header>

      <StatusFilter value={filter} onChange={setFilter} />

      {loading ? (
        <section className="card status-panel" aria-live="polite">
          <p>Loading tasks...</p>
        </section>
      ) : null}

      {loadError ? (
        <section className="card error-panel" role="alert">
          <p>{loadError}</p>
          <button type="button" className="button" onClick={fetchTasks}>
            Reload tasks
          </button>
        </section>
      ) : null}

      {!loading && !loadError ? (
        <TaskList
          tasks={filteredTasks}
          totalTasksCount={tasks.length}
          updatingTaskIds={updatingTaskIds}
          updateErrors={updateErrors}
          onToggle={handleToggle}
          onRetry={handleToggle}
        />
      ) : null}
    </section>
  );
}
