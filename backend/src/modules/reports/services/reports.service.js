const { getDataFilePath, readJsonArray } = require('../../../utils/jsonStore');

const TASKS_FILE_PATH = getDataFilePath('tasks.json');
const ACTIVITY_FILE_PATH = getDataFilePath('activity.json');

async function getTasksSummary() {
  const [tasks, activities] = await Promise.all([
    readJsonArray(TASKS_FILE_PATH),
    readJsonArray(ACTIVITY_FILE_PATH)
  ]);

  const total = tasks.length;

  const byStatus = {
    todo: 0,
    done: 0,
  };

  for (const task of tasks) {
    byStatus[task.completed ? 'done' : 'todo'] += 1;
  }

  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  const recentActivityCount = activities.filter((activity) => {
    const timestamp = Date.parse(activity.when);
    return Number.isFinite(timestamp) && timestamp >= sevenDaysAgo && timestamp <= now;
  }).length;

  return {
    total,
    byStatus,
    recentActivityCount
  };
}

module.exports = {
  getTasksSummary
};
