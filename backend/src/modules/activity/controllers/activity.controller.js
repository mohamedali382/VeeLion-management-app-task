// variable names is not clear - issue in code quality
const aSvc = require('../services/activity.service');


//no error handling - issue in bug (try, catch)
function get_activity(req, res) {
  const x = aSvc.getAllActivity();
  res.json(x);
}
//no error handling - issue in bug (try, catch), no guard for input data - issue in bug
function addActivity(req, res) {
  const bodyData = req.body || {};
  const made = aSvc.createNewActivity(bodyData);
  res.status(201).json(made);
}


//inconsistent naming convention - issue in code quality (get_activity vs addActivity)
module.exports = {
  get_activity,
  addActivity,
};
