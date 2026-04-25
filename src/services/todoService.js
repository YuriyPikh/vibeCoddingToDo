const fs = require("fs/promises");
const path = require("path");
const { randomUUID } = require("crypto");

class TodoService {
  constructor({ filePath }) {
    this.filePath = filePath;
    this.writeQueue = Promise.resolve();
    this.ready = this.ensureStore();
  }

  async ensureStore() {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });

    try {
      await fs.access(this.filePath);
    } catch {
      await fs.writeFile(this.filePath, "[]\n", "utf8");
    }
  }

  async readTodos() {
    await this.ready;
    const raw = await fs.readFile(this.filePath, "utf8");
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      throw new Error("Todo store must contain an array.");
    }

    return parsed;
  }

  async writeTodos(todos) {
    this.writeQueue = this.writeQueue.then(() =>
      fs.writeFile(this.filePath, `${JSON.stringify(todos, null, 2)}\n`, "utf8"),
    );

    return this.writeQueue;
  }

  async getDashboard() {
    const todos = await this.readTodos();
    const orderedTodos = [...todos].sort((left, right) =>
      right.createdAt.localeCompare(left.createdAt),
    );

    return {
      todos: orderedTodos,
      stats: {
        total: orderedTodos.length,
        remaining: orderedTodos.filter((todo) => !todo.isCompleted).length,
        completed: orderedTodos.filter((todo) => todo.isCompleted).length,
      },
    };
  }

  async create(title) {
    const todos = await this.readTodos();
    const nextTodo = {
      id: randomUUID(),
      title,
      isCompleted: false,
      createdAt: new Date().toISOString(),
    };

    todos.push(nextTodo);
    await this.writeTodos(todos);
    return nextTodo;
  }

  async toggle(id) {
    const todos = await this.readTodos();
    const todo = todos.find((entry) => entry.id === id);

    if (!todo) {
      return null;
    }

    todo.isCompleted = !todo.isCompleted;
    await this.writeTodos(todos);
    return todo;
  }

  async remove(id) {
    const todos = await this.readTodos();
    const nextTodos = todos.filter((entry) => entry.id !== id);

    if (nextTodos.length === todos.length) {
      return false;
    }

    await this.writeTodos(nextTodos);
    return true;
  }
}

module.exports = {
  TodoService,
};
