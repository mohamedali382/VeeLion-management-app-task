"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { parseErrorMessage, parseTaskResponse, parseTasksResponse } from "@/lib/apiValidation";
import type { Task, TaskFilter } from "@/types/api";

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

async function requestJson<T>(
  url: string,
  parse: (value: unknown) => T,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      body = null;
    }

    throw new Error(parseErrorMessage(body, `Request failed with ${response.status}`));
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new Error("The API returned invalid JSON.");
  }

  return parse(body);
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<TaskFilter>("all");
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string>("");
  const [updateErrors, setUpdateErrors] = useState<Record<string, string>>({});
  const [updatingTaskIds, setUpdatingTaskIds] = useState<Set<string>>(() => new Set());
  const pendingTaskIds = useRef(new Set<string>());

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError("");

      const nextTasks = await requestJson("/api/tasks", parseTasksResponse, {
        method: "GET",
      });

      setTasks(nextTasks);
    } catch (error) {
      setLoadError(getErrorMessage(error, "Could not load tasks right now."));
    } finally {
      setLoading(false);
    }
  }, []);

  const updateTaskStatus = useCallback(async (taskId: string, completed: boolean) => {
    if (pendingTaskIds.current.has(taskId)) {
      return;
    }

    pendingTaskIds.current.add(taskId);
    setUpdatingTaskIds(new Set(pendingTaskIds.current));
    setUpdateErrors((previous) => {
      const next = { ...previous };
      delete next[taskId];
      return next;
    });

    try {
      const updatedTask = await requestJson(
        `/api/tasks/${encodeURIComponent(taskId)}`,
        parseTaskResponse,
        { method: "PATCH", body: JSON.stringify({ completed }) }
      );

      setTasks((previous) =>
        previous.map((task) => (task.id === taskId ? updatedTask : task))
      );
    } catch (error) {
      setUpdateErrors((previous) => ({
        ...previous,
        [taskId]: getErrorMessage(error, "Could not update task status."),
      }));
    } finally {
      pendingTaskIds.current.delete(taskId);
      setUpdatingTaskIds(new Set(pendingTaskIds.current));
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const filteredTasks = useMemo(() => {
    if (filter === "completed") {
      return tasks.filter((task) => task.completed);
    }

    if (filter === "pending") {
      return tasks.filter((task) => !task.completed);
    }

    return tasks;
  }, [tasks, filter]);

  return {
    tasks,
    filteredTasks,
    filter,
    loading,
    loadError,
    updateErrors,
    updatingTaskIds,
    setFilter,
    fetchTasks,
    updateTaskStatus,
  };
}
