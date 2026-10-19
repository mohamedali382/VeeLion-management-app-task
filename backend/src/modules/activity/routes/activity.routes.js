const express = require('express');

const asyncHandler = require('../../../middleware/asyncHandler');
const c = require('../controllers/activity.controller');

const activityRouter = express.Router();

activityRouter.get('/', asyncHandler(c.getActivity));
activityRouter.post('/', asyncHandler(c.addActivity));

module.exports = activityRouter;
