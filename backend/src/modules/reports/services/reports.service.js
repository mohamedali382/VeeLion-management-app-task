const path = require('node:path');
const { readJsonArray } = require('../../../utils/jsonStore');

const TASKS_FILE_PATH = path.join(process.cwd(), 'data', 'tasks.json');
const ACTIVITY_FILE_PATH = path.join(process.cwd(), 'data', 'activity.json');

async function getTasksSummary() {
  const [tasks, activities] = await Promise.all([
    readJsonArray(TASKS_FILE_PATH),
    readJsonArray(ACTIVITY_FILE_PATH)
  ]);

  const total = tasks.length;

  const byStatus = {
    todo: tasks.filter(t => !t.completed).length,
    "in-progress": 0,
    done: tasks.filter(t => t.completed).length
  };

  const recentActivityCount = activities.length;

  return {
    total,
    byStatus,
    recentActivityCount
  };
}

module.exports = {
  getTasksSummary
};
