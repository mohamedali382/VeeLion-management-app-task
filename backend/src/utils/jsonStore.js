const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

const DATA_DIRECTORY = path.resolve(
  process.env.DATA_DIR || path.join(__dirname, '../../data')
);
const pendingUpdates = new Map();

function getDataFilePath(fileName) {
  return path.join(DATA_DIRECTORY, fileName);
}

async function readJsonArray(filePath) {
  let raw;

  try {
    raw = await fs.readFile(filePath, 'utf-8');
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }

    throw error;
  }

  if (!raw.trim()) {
    return [];
  }

  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error(`Expected a JSON array in ${path.basename(filePath)}.`);
  }

  return parsed;
}

async function writeJsonArray(filePath, data) {
  const temporaryPath = `${filePath}.${process.pid}.${randomUUID()}.tmp`;

  await fs.mkdir(path.dirname(filePath), { recursive: true });

  try {
    await fs.writeFile(
      temporaryPath,
      `${JSON.stringify(data, null, 2)}\n`,
      'utf-8'
    );
    await fs.rename(temporaryPath, filePath);
  } catch (error) {
    await fs.rm(temporaryPath, { force: true }).catch(() => {});
    throw error;
  }
}

async function updateJsonArray(filePath, update) {
  const previousUpdate = pendingUpdates.get(filePath) || Promise.resolve();
  const currentUpdate = previousUpdate.catch(() => {}).then(async () => {
    const data = await readJsonArray(filePath);
    const result = await update(data);
    await writeJsonArray(filePath, data);
    return result;
  });

  pendingUpdates.set(filePath, currentUpdate);

  try {
    return await currentUpdate;
  } finally {
    if (pendingUpdates.get(filePath) === currentUpdate) {
      pendingUpdates.delete(filePath);
    }
  }
}

module.exports = {
  getDataFilePath,
  readJsonArray,
  writeJsonArray,
  updateJsonArray,
};
