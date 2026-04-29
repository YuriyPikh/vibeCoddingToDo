const path = require("path");

const envModulePath = require.resolve("../../src/config/env");

describe("env config helpers", () => {
  afterEach(() => {
    delete process.env.PORT;
    delete process.env.TODOS_FILE;
    delete process.env.NODE_ENV;
    delete process.env.UI_BADGE_WORD;
    delete process.env.BUILD_TYPE;
    delete process.env.VERCEL;
    delete process.env.VERCEL_ENV;
    delete require.cache[envModulePath];
  });

  it("defaults the port when the value is missing or invalid", () => {
    const { resolvePort } = require("../../src/config/env");

    expect(resolvePort()).toBe(3000);
    expect(resolvePort("not-a-number")).toBe(3000);
    expect(resolvePort("-1")).toBe(3000);
  });

  it("returns a positive numeric port", () => {
    const { resolvePort } = require("../../src/config/env");

    expect(resolvePort("4123")).toBe(4123);
  });

  it("resolves the default and relative todo file paths", () => {
    const { env, resolveTodosFile } = require("../../src/config/env");

    expect(resolveTodosFile()).toBe(path.join(env.dataDir, "todos.json"));
    expect(resolveTodosFile(path.join("tmp", "todos.json"))).toBe(
      path.join(env.rootDir, "tmp", "todos.json"),
    );
  });

  it("uses /tmp for the default todo file on Vercel", () => {
    const { resolveTodosFile } = require("../../src/config/env");

    expect(resolveTodosFile(undefined, { VERCEL: "1" })).toBe("/tmp/todos.json");
    expect(resolveTodosFile(undefined, { VERCEL_ENV: "production" })).toBe("/tmp/todos.json");
  });

  it("keeps absolute todo file paths unchanged", () => {
    const { resolveTodosFile } = require("../../src/config/env");
    const absolutePath = path.join(process.cwd(), "custom", "todos.json");

    expect(resolveTodosFile(absolutePath)).toBe(absolutePath);
  });

  it("builds the exported env object from process variables at module load", () => {
    process.env.PORT = "4567";
    process.env.NODE_ENV = "test";
    process.env.TODOS_FILE = path.join("tmp", "from-env.json");
    process.env.BUILD_TYPE = "staging";
    process.env.UI_BADGE_WORD = "Review";

    delete require.cache[envModulePath];

    const { env } = require("../../src/config/env");

    expect(env.port).toBe(4567);
    expect(env.nodeEnv).toBe("test");
    expect(env.buildType).toBe("staging");
    expect(env.uiBadgeWord).toBe("Review");
    expect(env.todosFile).toBe(path.join(env.rootDir, "tmp", "from-env.json"));
  });

  it("loads development values from .env by default", () => {
    const { env } = require("../../src/config/env");

    expect(env.nodeEnv).toBe("development");
    expect(env.buildType).toBe("development");
  });

  it("loads production values from .env.production when NODE_ENV is production", () => {
    process.env.NODE_ENV = "production";

    delete require.cache[envModulePath];

    const { env } = require("../../src/config/env");

    expect(env.nodeEnv).toBe("production");
    expect(env.buildType).toBe("production");
  });

  it("falls back to source asset paths when build metadata is absent", () => {
    const { env } = require("../../src/config/env");

    expect(env.assetPaths).toEqual({
      stylesheet: "/css/styles.css",
      appScript: "/js/app.js",
    });
  });

  it("resolves manifest-driven asset paths", () => {
    const { resolveAssetPaths } = require("../../src/config/env");

    expect(
      resolveAssetPaths({
        "/css/styles.css": "/assets/styles-abc12345.css",
        "/js/app.js": "/assets/app-def67890.js",
      }),
    ).toEqual({
      stylesheet: "/assets/styles-abc12345.css",
      appScript: "/assets/app-def67890.js",
    });
  });
});
