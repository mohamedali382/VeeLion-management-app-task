const activityService = require('../services/activity.service');

async function getActivity(req, res) {
  const activities = await activityService.getAllActivity();
  res.status(200).json(activities);
}

async function addActivity(req, res) {
  const activity = await activityService.createNewActivity(req.body);
  res.status(201).json(activity);
}

module.exports = {
  getActivity,
  addActivity,
};
