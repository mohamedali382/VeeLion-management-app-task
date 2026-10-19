const express = require('express');
const { rateLimit } = require('express-rate-limit');

const tasksRouter = require('./modules/tasks/routes/tasks.routes');
const activityRouter = require('./modules/activity/routes/activity.routes');
const reportsRouter = require('./modules/reports/routes/reports.routes');
const errorHandler = require('./middleware/errorHandler');
const HttpError = require('./utils/httpError');

const app = express();
const writeRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => ['GET', 'HEAD', 'OPTIONS'].includes(req.method),
  message: {
    error: { message: 'Too many write requests. Please try again later.' },
  },
});

app.use(['/tasks', '/activity'], writeRateLimit);
app.use(express.json({ limit: '16kb' }));
app.use('/tasks', tasksRouter);
app.use('/activity', activityRouter);
app.use('/reports', reportsRouter);

app.use((req, res, next) => {
  next(new HttpError(404, `Route not found: ${req.method} ${req.originalUrl}`));
});

app.use(errorHandler);

module.exports = app;
