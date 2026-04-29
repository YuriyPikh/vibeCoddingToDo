const { defineConfig } = require("vitest/config");

module.exports = defineConfig({
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.js"],
    globals: true,
    reporters: "default",
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      reportsDirectory: "./coverage/unit",
      include: ["src/**/*.js"],
      exclude: ["src/server.js"],
      thresholds: {
        lines: 80,
        functions: 80,
        statements: 80,
        branches: 80,
      },
    },
  },
});
