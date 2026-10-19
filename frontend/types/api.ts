export type TaskStatus = "todo" | "in-progress" | "done";

export type Task = {
  id: string;
  title: string;
  completed: boolean;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
};

export type TaskCreateInput = {
  title: string;
  status?: TaskStatus;
  completed?: boolean;
};

export type TaskUpdateInput = {
  title?: string;
  status?: TaskStatus;
  completed?: boolean;
};

export type ActivityLog = {
  id: string;
  action?: string;
  info?: string;
  when: string;
};

export type TasksResponse = {
  data: Task[];
};

export type TaskResponse = {
  data: Task;
};

export type ErrorResponse = {
  error?: {
    message?: string;
  };
};

export type TaskFilter = "all" | "completed" | "pending";

export type TasksSummary = {
  total: number;
  byStatus: Record<TaskStatus, number>;
  recentActivityCount: number;
};
