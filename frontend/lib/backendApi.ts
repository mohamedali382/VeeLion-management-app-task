import { BACKEND_BASE_URL } from "@/lib/constants";
import {
  parseActivityResponse,
  parseTaskResponse,
  parseTasksResponse,
} from "@/lib/apiValidation";
import type { ActivityLog, ErrorResponse, Task } from "@/types/api";

export class BackendApiError extends Error {
  constructor(public readonly statusCode: number, message: string) {
    super(message);
    this.name = "BackendApiError";
  }
}

function buildBackendUrl(path: string): string {
  return `${BACKEND_BASE_URL}${path}`;
}

async function parseError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as ErrorResponse;
    return body.error?.message || `Request failed with status ${response.status}`;
  } catch {
    return `Request failed with status ${response.status}`;
  }
}

async function requestBackend(path: string, init: RequestInit | undefined, fallback: string) {
  let response: Response;

  try {
    response = await fetch(buildBackendUrl(path), {
      ...init,
      cache: "no-store",
    });
  } catch (error) {
    throw new BackendApiError(502, fallback);
  }

  if (!response.ok) {
    throw new BackendApiError(response.status, await parseError(response));
  }

  try {
    return await response.json() as unknown;
  } catch {
    throw new BackendApiError(502, "The backend returned an invalid response.");
  }
}

export async function getTasksFromBackend(): Promise<Task[]> {
  const body = await requestBackend("/tasks", undefined, "Unable to fetch tasks.");
  try {
    return parseTasksResponse(body);
  } catch {
    throw new BackendApiError(502, "The backend returned invalid task data.");
  }
}

export async function updateTaskInBackend(taskId: string, completed: boolean): Promise<Task> {
  const body = await requestBackend(
    `/tasks/${encodeURIComponent(taskId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed }),
    },
    "Unable to update task."
  );

  try {
    return parseTaskResponse(body);
  } catch {
    throw new BackendApiError(502, "The backend returned invalid task data.");
  }
}

export async function getActivityFromBackend(): Promise<ActivityLog[]> {
  const body = await requestBackend("/activity", undefined, "Unable to fetch activity logs.");
  try {
    return parseActivityResponse(body);
  } catch {
    throw new BackendApiError(502, "The backend returned invalid activity data.");
  }
}
