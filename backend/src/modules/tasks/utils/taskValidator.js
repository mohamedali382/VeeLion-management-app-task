const HttpError = require('../../../utils/httpError');

const ALLOWED_FIELDS = ['title', 'completed', 'status'];
const TASK_STATUSES = ['todo', 'in-progress', 'done'];

function validatePayloadShape(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new HttpError(400, 'Body must be a JSON object.');
  }
}

function ensureNoUnknownFields(payload) {
  const unknownFields = Object.keys(payload).filter(
    (field) => !ALLOWED_FIELDS.includes(field)
  );

  if (unknownFields.length > 0) {
    throw new HttpError(400, 'Body contains unsupported fields.', {
      unsupportedFields: unknownFields,
    });
  }
}

function normalizeTitleIfPresent(payload, normalized) {
  if (!Object.hasOwn(payload, 'title')) {
    return;
  }

  if (typeof payload.title !== 'string') {
    throw new HttpError(400, '"title" must be a string.');
  }

  const trimmedTitle = payload.title.trim();
  if (!trimmedTitle) {
    throw new HttpError(400, '"title" cannot be empty.');
  }

  normalized.title = trimmedTitle;
}

function normalizeCompletedIfPresent(payload, normalized) {
  if (!Object.hasOwn(payload, 'completed')) {
    return;
  }

  if (typeof payload.completed !== 'boolean') {
    throw new HttpError(400, '"completed" must be a boolean.');
  }

  normalized.completed = payload.completed;
}

function normalizeStatusIfPresent(payload, normalized) {
  if (!Object.hasOwn(payload, 'status')) {
    return;
  }

  if (!TASK_STATUSES.includes(payload.status)) {
    throw new HttpError(400, '"status" must be todo, in-progress, or done.');
  }

  normalized.status = payload.status;
}

function synchronizeStatus(normalized) {
  if (normalized.status !== undefined && normalized.completed !== undefined) {
    if (normalized.completed !== (normalized.status === 'done')) {
      throw new HttpError(400, '"status" and "completed" values conflict.');
    }
    return;
  }

  if (normalized.status !== undefined) {
    normalized.completed = normalized.status === 'done';
  } else if (normalized.completed !== undefined) {
    normalized.status = normalized.completed ? 'done' : 'todo';
  }
}

function validateCreateTask(payload) {
  validatePayloadShape(payload);
  ensureNoUnknownFields(payload);

  const normalized = {};
  normalizeTitleIfPresent(payload, normalized);
  normalizeCompletedIfPresent(payload, normalized);
  normalizeStatusIfPresent(payload, normalized);

  if (!Object.hasOwn(normalized, 'title')) {
    throw new HttpError(400, '"title" is required.');
  }

  if (!Object.hasOwn(normalized, 'completed') && !Object.hasOwn(normalized, 'status')) {
    normalized.completed = false;
    normalized.status = 'todo';
  } else {
    synchronizeStatus(normalized);
  }

  return normalized;
}

function validateUpdateTask(payload) {
  validatePayloadShape(payload);
  ensureNoUnknownFields(payload);

  const normalized = {};
  normalizeTitleIfPresent(payload, normalized);
  normalizeCompletedIfPresent(payload, normalized);
  normalizeStatusIfPresent(payload, normalized);

  if (Object.keys(normalized).length === 0) {
    throw new HttpError(400, 'Provide at least one updatable field.');
  }

  if (normalized.title !== undefined && normalized.title.length < 2) {
    throw new HttpError(400, 'Title must be at least 2 characters long.');
  }

  synchronizeStatus(normalized);

  return normalized;
}

module.exports = {
  validateCreateTask,
  validateUpdateTask,
};
