const fs = require("fs/promises");
const os = require("os");
const path = require("path");

const { TodoService } = require("../../src/services/todoService");

describe("TodoService", () => {
  let tempDir;
  let todoFile;
  let todoService;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "todo-service-"));
    todoFile = path.join(tempDir, "todos.json");
    todoService = new TodoService({ filePath: todoFile });
    await todoService.ready;
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it("creates todos and returns dashboard counts", async () => {
    await todoService.create("Write the report");
    await todoService.create("Push the branch");

    const dashboard = await todoService.getDashboard();

    expect(dashboard.stats).toEqual({
      total: 2,
      remaining: 2,
      completed: 0,
    });
    expect(dashboard.todos).toHaveLength(2);
    expect(dashboard.todos[0].title).toBe("Push the branch");
  });

  it("toggles completion and removes todos", async () => {
    const todo = await todoService.create("Review notes");

    const toggledTodo = await todoService.toggle(todo.id);
    const dashboardAfterToggle = await todoService.getDashboard();

    expect(toggledTodo.isCompleted).toBe(true);
    expect(dashboardAfterToggle.stats).toEqual({
      total: 1,
      remaining: 0,
      completed: 1,
    });

    await todoService.remove(todo.id);

    const dashboardAfterDelete = await todoService.getDashboard();
    expect(dashboardAfterDelete.stats).toEqual({
      total: 0,
      remaining: 0,
      completed: 0,
    });
  });

  it("returns null or false when an id does not exist", async () => {
    await expect(todoService.toggle("missing-id")).resolves.toBeNull();
    await expect(todoService.remove("missing-id")).resolves.toBe(false);
  });
});
