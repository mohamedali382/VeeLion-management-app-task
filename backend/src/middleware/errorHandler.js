const HttpError = require('../utils/httpError');

function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  const reportedStatus = Number.isInteger(error.statusCode)
    ? error.statusCode
    : error.status;
  const statusCode = Number.isInteger(reportedStatus)
    && reportedStatus >= 400
    && reportedStatus < 600
    ? reportedStatus
    : 500;
  const message = error instanceof HttpError
    ? error.message
    : statusCode >= 500
      ? 'Internal server error'
      : 'Invalid request.';

  const response = {
    error: {
      message,
    },
  };

  if (error instanceof HttpError && error.details) {
    response.error.details = error.details;
  }

  if (statusCode >= 500) {
    console.error(error);
  }

  return res.status(statusCode).json(response);
}

module.exports = errorHandler;
