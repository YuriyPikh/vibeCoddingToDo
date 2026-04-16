const path = require("path");

const rootDir = path.resolve(__dirname, "../..");
const dataDir = path.join(rootDir, "data");
const todosFile = path.join(dataDir, "todos.json");

function resolvePort(rawValue) {
  const parsed = Number.parseInt(rawValue, 10);

  if (Number.isNaN(parsed) || parsed <= 0) {
    return 3000;
  }

  return parsed;
}

module.exports = {
  env: {
    nodeEnv: process.env.NODE_ENV || "development",
    port: resolvePort(process.env.PORT),
    rootDir,
    dataDir,
    todosFile,
  },
};

