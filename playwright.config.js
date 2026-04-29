const path = require("path");
const { defineConfig } = require("@playwright/test");
const { e2eTodosFile, rootDir } = require("./tests/testPaths");

module.exports = defineConfig({
  testDir: path.join(rootDir, "tests", "e2e"),
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:3100",
    browserName: "chromium",
    headless: true,
  },
  webServer: {
    command: "node src/server.js",
    cwd: rootDir,
    url: "http://127.0.0.1:3100",
    reuseExistingServer: true,
    env: {
      PORT: "3100",
      NODE_ENV: "test",
      TODOS_FILE: e2eTodosFile,
    },
  },
});
