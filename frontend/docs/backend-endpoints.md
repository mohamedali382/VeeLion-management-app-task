# Backend API Endpoints

Base URL: `http://localhost:4000`

## Shared Error Shape

```ts
type ErrorResponse = {
  error: {
    message: string;
  };
};
```

## Task Endpoints

### GET /tasks

Fetch all tasks.

```ts
type Task = {
  id: string;
  title: string;
  completed: boolean;
  status: "todo" | "in-progress" | "done";
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
};

type GetTasksResponse = {
  data: Task[];
};
```

### GET /tasks/:id

Fetch one task by ID.

```ts
type GetTaskResponse = {
  data: Task;
};
```

Possible errors:
- `404` when task does not exist.

### POST /tasks

Create a task.

```ts
type CreateTaskRequest = {
  title: string; // required, trimmed, non-empty
  completed?: boolean; // default false
  status?: "todo" | "in-progress" | "done";
};

type CreateTaskResponse = {
  data: Task;
};
```

Possible errors:
- `400` when body is not an object.
- `400` when title is missing/invalid/empty.
- `400` when completed is not a boolean.

### PATCH /tasks/:id

Update task title or status.

```ts
type PatchTaskRequest = {
  title?: string; // if provided, must be string and long enough after trim
  completed?: boolean;
  status?: "todo" | "in-progress" | "done";
};

type PatchTaskResponse = {
  data: Task;
};
```

Possible errors:
- `400` when body is invalid.
- `400` when no supported fields are provided.
- `404` when task does not exist.

### DELETE /tasks/:id

Delete task by ID.

```ts
type DeleteTaskResponse = void; // status 204
```

Possible errors:
- `404` when task does not exist.

## Activity Endpoints

### GET /activity

Fetch activity logs.

```ts
type ActivityLog = {
  id: string;
  action?: string;
  info?: string;
  when: string; // ISO datetime
};

type GetActivityResponse = ActivityLog[];
```

### POST /activity

Create activity log entry.

```ts
type CreateActivityRequest = {
  action?: string;
  info?: string;
};

type CreateActivityResponse = ActivityLog;
```

Notes:
- Provided `action` and `info` values must be non-empty strings.
- Response shape for activity endpoints is raw objects/arrays (not wrapped in `data`).

## Reports Endpoints

### GET /reports/tasks-summary

Fetch summary statistics for tasks and activity.

```ts
type TasksSummary = {
  total: number;
  byStatus: {
    todo: number;
    "in-progress": number;
    done: number;
  };
  recentActivityCount: number;
};

type GetTasksSummaryResponse = TasksSummary;
```

Notes:
- `status` is the task status source of truth; older records without it are derived from `completed` (`false` becomes `todo`, `true` becomes `done`).
- `completed` remains synchronized for compatibility: it is true only for `done`.
- `recentActivityCount` counts valid activity timestamps from the preceding seven days.
- Response shape is raw object.

## Request limits

- JSON request bodies are limited to 16 KB.
- Write requests to `/tasks` and `/activity` are limited to 100 requests per IP per 15 minutes. Read requests are not rate-limited.
