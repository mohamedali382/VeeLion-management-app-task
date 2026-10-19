import type { ActivityLog, Task } from "@/types/api";

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isTask(value: unknown): value is Task {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.completed === "boolean" &&
    typeof value.createdAt === "string" &&
    Number.isFinite(Date.parse(value.createdAt)) &&
    typeof value.updatedAt === "string" &&
    Number.isFinite(Date.parse(value.updatedAt))
  );
}

function isActivityLog(value: unknown): value is ActivityLog {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.when === "string" &&
    Number.isFinite(Date.parse(value.when)) &&
    (value.action === undefined || typeof value.action === "string") &&
    (value.info === undefined || typeof value.info === "string")
  );
}

export function parseTasksResponse(value: unknown): Task[] {
  if (!isRecord(value) || !Array.isArray(value.data) || !value.data.every(isTask)) {
    throw new Error("The task service returned invalid data.");
  }

  return value.data;
}

export function parseTaskResponse(value: unknown): Task {
  if (!isRecord(value) || !isTask(value.data)) {
    throw new Error("The task service returned invalid data.");
  }

  return value.data;
}

export function parseActivityResponse(value: unknown): ActivityLog[] {
  if (!Array.isArray(value) || !value.every(isActivityLog)) {
    throw new Error("The activity service returned invalid data.");
  }

  return value;
}

export function parseErrorMessage(value: unknown, fallback: string): string {
  if (!isRecord(value) || !isRecord(value.error) || typeof value.error.message !== "string") {
    return fallback;
  }

  return value.error.message;
}
