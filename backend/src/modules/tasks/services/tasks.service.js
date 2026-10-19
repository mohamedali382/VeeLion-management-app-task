const { createId } = require('../../../utils/id');
const {
  getDataFilePath,
  readJsonArray,
  updateJsonArray,
} = require('../../../utils/jsonStore');
const HttpError = require('../../../utils/httpError');
const {
  validateCreateTask,
  validateUpdateTask,
} = require('../utils/taskValidator');

const TASKS_FILE_PATH = getDataFilePath('tasks.json');

function buildTaskRecord(payload) {
  const now = new Date().toISOString();

  return {
    id: createId(),
    title: payload.title,
    completed: payload.completed,
    createdAt: now,
    updatedAt: now,
  };
}

async function getAllTasks() {
  return readJsonArray(TASKS_FILE_PATH);
}

async function getTaskById(taskId) {
  const tasks = await readJsonArray(TASKS_FILE_PATH);
  const task = tasks.find((item) => item.id === taskId);

  if (!task) {
    throw new HttpError(404, 'Task not found.');
  }

  return task;
}

async function createTask(payload) {
  const normalized = validateCreateTask(payload);

  return updateJsonArray(TASKS_FILE_PATH, (tasks) => {
    const newTask = buildTaskRecord(normalized);
    tasks.push(newTask);
    return newTask;
  });
}

async function updateTask(taskId, payload) {
  const updates = validateUpdateTask(payload);

  return updateJsonArray(TASKS_FILE_PATH, (tasks) => {
    const taskIndex = tasks.findIndex((item) => item.id === taskId);

    if (taskIndex === -1) {
      throw new HttpError(404, 'Task not found.');
    }

    const updatedTask = {
      ...tasks[taskIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    tasks[taskIndex] = updatedTask;
    return updatedTask;
  });
}

async function deleteTask(taskId) {
  return updateJsonArray(TASKS_FILE_PATH, (tasks) => {
    const taskIndex = tasks.findIndex((item) => item.id === taskId);

    if (taskIndex === -1) {
      throw new HttpError(404, 'Task not found.');
    }

    return tasks.splice(taskIndex, 1)[0];
  });
}

module.exports = {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
};
