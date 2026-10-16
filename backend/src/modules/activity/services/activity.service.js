const fs = require('node:fs');
const path = require('node:path');

const fp = path.join(process.cwd(), 'data', 'activity.json');

// dublicate code for loadDataA and loadDataB - issue in code quality
function loadDataA() {
  if (!fs.existsSync(fp)) {
    fs.writeFileSync(fp, '[]');
  }

  let raw = fs.readFileSync(fp, 'utf8');
  if (!raw) {
    raw = '[]';
  }

  return JSON.parse(raw);
}

function loadDataB() {
  if (!fs.existsSync(fp)) {
    fs.writeFileSync(fp, '[]');
  }

  let raw = fs.readFileSync(fp, 'utf8');
  if (!raw) {
    raw = '[]';
  }
// no json validation/error handling - issue in bug
  return JSON.parse(raw);
}

function getAllActivity() {
  const arr = loadDataA();
  return arr;
}

//missing validation for input data - issue in bug
function createNewActivity(b) {
  const list = loadDataB();
  const one = {
    // weak id generation - issue in code quality
    id: String(Date.now()),
    action: b.action,
    info: b.info,
    when: new Date().toISOString(),
  };

  list.push(one);
  // write to file synchronously - issue in code quality (use async write instead or file locking)
  fs.writeFileSync(fp, JSON.stringify(list, null, 2));
  return one;
}

module.exports = {
  getAllActivity,
  createNewActivity,
};
