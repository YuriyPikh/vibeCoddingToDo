const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const e2eTodosFile = path.join(rootDir, "data", "e2e-todos.json");

module.exports = {
  rootDir,
  e2eTodosFile,
};

