const { createId } = require('../../../utils/id');
const {
  getDataFilePath,
  readJsonArray,
  updateJsonArray,
} = require('../../../utils/jsonStore');
const HttpError = require('../../../utils/httpError');

const ACTIVITY_FILE_PATH = getDataFilePath('activity.json');

function validateActivityPayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new HttpError(400, 'Body must be a JSON object.');
  }

  const allowedFields = ['action', 'info'];
  const unsupportedFields = Object.keys(payload).filter(
    (field) => !allowedFields.includes(field)
  );

  if (unsupportedFields.length > 0) {
    throw new HttpError(400, 'Body contains unsupported fields.', {
      unsupportedFields,
    });
  }

  const normalized = {};
  for (const field of allowedFields) {
    if (!Object.hasOwn(payload, field)) {
      continue;
    }

    if (typeof payload[field] !== 'string' || !payload[field].trim()) {
      throw new HttpError(400, `"${field}" must be a non-empty string.`);
    }

    normalized[field] = payload[field].trim();
  }

  return normalized;
}

async function getAllActivity() {
  return readJsonArray(ACTIVITY_FILE_PATH);
}

async function createNewActivity(payload) {
  const normalized = validateActivityPayload(payload);
  const activity = {
    id: createId(),
    ...normalized,
    when: new Date().toISOString(),
  };

  await updateJsonArray(ACTIVITY_FILE_PATH, (activities) => {
    activities.push(activity);
  });

  return activity;
}

module.exports = {
  getAllActivity,
  createNewActivity,
};
