const fs = require("fs/promises");
const os = require("os");
const path = require("path");
const request = require("supertest");

const { createApp } = require("../../src/app");

describe("Express app", () => {
  let tempDir;
  let todoFilePath;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "todo-app-"));
    todoFilePath = path.join(tempDir, "todos.json");
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it("serves the home page and the 404 page", async () => {
    const app = createApp({ todoFilePath, nodeEnv: "test" });

    const homeResponse = await request(app).get("/");
    const notFoundResponse = await request(app).get("/missing-page");

    expect(homeResponse.status).toBe(200);
    expect(homeResponse.text).toContain("VibeCoddedToDo");
    expect(notFoundResponse.status).toBe(404);
    expect(notFoundResponse.text).toContain("That page does not exist.");
  });

  it("supports the core todo flow through the real routes", async () => {
    const app = createApp({ todoFilePath, nodeEnv: "production" });

    const createResponse = await request(app)
      .post("/todos")
      .type("form")
      .send({ title: "Ship lab task" });

    expect(createResponse.status).toBe(302);
    expect(createResponse.headers.location).toBe("/");

    const dashboardResponse = await request(app).get("/");
    expect(dashboardResponse.text).toContain("Ship lab task");
    expect(dashboardResponse.text).toContain("1 items");

    const todos = JSON.parse(await fs.readFile(todoFilePath, "utf8"));
    const [{ id }] = todos;

    const toggleResponse = await request(app).post(`/todos/${id}/toggle`);
    expect(toggleResponse.status).toBe(302);

    const completedResponse = await request(app).get("/");
    expect(completedResponse.text).toContain("Done");

    const deleteResponse = await request(app).post(`/todos/${id}/delete`);
    expect(deleteResponse.status).toBe(302);

    const emptyResponse = await request(app).get("/");
    expect(emptyResponse.text).toContain("No tasks yet.");
  });

  it("returns validation feedback for invalid submissions", async () => {
    const app = createApp({ todoFilePath, nodeEnv: "test" });

    const response = await request(app)
      .post("/todos")
      .type("form")
      .send({ title: "   " });

    expect(response.status).toBe(400);
    expect(response.text).toContain("Enter a task before adding it.");
  });

  it("returns 404 when trying to toggle a todo that does not exist", async () => {
    const app = createApp({ todoFilePath, nodeEnv: "test" });

    const response = await request(app).post("/todos/missing-id/toggle");

    expect(response.status).toBe(404);
  });

  it("renders the error page when the todo service fails", async () => {
    const failingService = {
      getDashboard: vi.fn().mockRejectedValue(new Error("service failed")),
      create: vi.fn().mockRejectedValue(new Error("service failed")),
      toggle: vi.fn().mockRejectedValue(new Error("service failed")),
      remove: vi.fn().mockRejectedValue(new Error("service failed")),
    };
    const app = createApp({
      nodeEnv: "test",
      todoService: failingService,
    });

    const homeResponse = await request(app).get("/");
    const createResponse = await request(app)
      .post("/todos")
      .type("form")
      .send({ title: "Broken task" });

    expect(homeResponse.status).toBe(500);
    expect(homeResponse.text).toContain("Something went wrong while loading the app.");
    expect(createResponse.status).toBe(500);
    expect(createResponse.text).toContain("Something went wrong while loading the app.");
  });
});
