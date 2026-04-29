const { TITLE_LIMIT, validateTitle } = require("../../src/validation/todoValidation");
const { createTodoController } = require("../../src/controllers/todoController");

function createResponseDouble() {
  return {
    statusCode: 200,
    renderedView: null,
    renderedState: null,
    redirectTarget: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    render(view, state) {
      this.renderedView = view;
      this.renderedState = state;
      return this;
    },
    redirect(target) {
      this.redirectTarget = target;
      return this;
    },
    sendStatus(code) {
      this.statusCode = code;
      return this;
    },
  };
}

describe("todoController", () => {
  it("renders the home page with dashboard data", async () => {
    const todoService = {
      getDashboard: vi.fn().mockResolvedValue({
        todos: [{ id: "1", title: "Write tests", isCompleted: false }],
        stats: { total: 1, remaining: 1, completed: 0 },
      }),
    };
    const controller = createTodoController({ todoService });
    const res = createResponseDouble();
    const next = vi.fn();

    await controller.home({}, res, next);

    expect(res.renderedView).toBe("index");
    expect(res.renderedState.page.titleLimit).toBe(TITLE_LIMIT);
    expect(res.renderedState.page.todos).toHaveLength(1);
    expect(next).not.toHaveBeenCalled();
  });

  it("re-renders with an error when title validation fails", async () => {
    const todoService = {
      getDashboard: vi.fn().mockResolvedValue({
        todos: [],
        stats: { total: 0, remaining: 0, completed: 0 },
      }),
    };
    const controller = createTodoController({ todoService });
    const res = createResponseDouble();

    await controller.create(
      { body: { title: "   " } },
      res,
      vi.fn(),
    );

    expect(res.statusCode).toBe(400);
    expect(res.renderedState.page.errorMessage).toBe(validateTitle("   ").message);
    expect(res.renderedState.page.draftTitle).toBe("   ");
  });

  it("creates a todo and redirects on valid input", async () => {
    const todoService = {
      create: vi.fn().mockResolvedValue({ id: "1" }),
    };
    const controller = createTodoController({ todoService });
    const res = createResponseDouble();

    await controller.create(
      { body: { title: "  Finish   report " } },
      res,
      vi.fn(),
    );

    expect(todoService.create).toHaveBeenCalledWith("Finish report");
    expect(res.redirectTarget).toBe("/");
  });

  it("returns 404 when toggling a missing todo", async () => {
    const todoService = {
      toggle: vi.fn().mockResolvedValue(null),
    };
    const controller = createTodoController({ todoService });
    const res = createResponseDouble();

    await controller.toggle({ params: { id: "missing-id" } }, res, vi.fn());

    expect(res.statusCode).toBe(404);
    expect(res.redirectTarget).toBeNull();
  });

  it("passes service failures to next in each action", async () => {
    const next = vi.fn();
    const failure = new Error("boom");
    const todoService = {
      getDashboard: vi.fn().mockRejectedValue(failure),
      create: vi.fn().mockRejectedValue(failure),
      toggle: vi.fn().mockRejectedValue(failure),
      remove: vi.fn().mockRejectedValue(failure),
    };
    const controller = createTodoController({ todoService });

    await controller.home({}, createResponseDouble(), next);
    await controller.create({ body: { title: "Task" } }, createResponseDouble(), next);
    await controller.toggle({ params: { id: "1" } }, createResponseDouble(), next);
    await controller.remove({ params: { id: "1" } }, createResponseDouble(), next);

    expect(next).toHaveBeenCalledTimes(4);
    expect(next).toHaveBeenNthCalledWith(1, failure);
    expect(next).toHaveBeenNthCalledWith(2, failure);
    expect(next).toHaveBeenNthCalledWith(3, failure);
    expect(next).toHaveBeenNthCalledWith(4, failure);
  });
});
