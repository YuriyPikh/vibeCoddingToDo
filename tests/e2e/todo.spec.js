const fs = require("fs/promises");

const { test, expect } = require("@playwright/test");

const { e2eTodosFile } = require("../testPaths");

test.beforeEach(async () => {
  await fs.writeFile(e2eTodosFile, "[]\n", "utf8");
});

test("creates, completes, and deletes a todo", async ({ page }) => {
  await page.goto("/");

  await page.getByLabel("New task").fill("Finish lab report");
  await page.getByRole("button", { name: "Add Task" }).click();

  const todoItem = page.locator('[data-testid="todo-item"]').filter({
    hasText: "Finish lab report",
  });

  await expect(todoItem).toHaveCount(1);
  await expect(page.locator('[data-testid="stat-open"] strong')).toHaveText("1");
  await expect(page.locator('[data-testid="stat-done"] strong')).toHaveText("0");

  await todoItem.getByTestId("toggle-todo").click();

  await expect(todoItem).toHaveClass(/is-complete/);
  await expect(todoItem.getByText("Done")).toBeVisible();
  await expect(page.locator('[data-testid="stat-open"] strong')).toHaveText("0");
  await expect(page.locator('[data-testid="stat-done"] strong')).toHaveText("1");

  await todoItem.getByTestId("delete-todo").click();

  await expect(page.getByText("No tasks yet.")).toBeVisible();
  await expect(page.locator('[data-testid="stat-total"] strong')).toHaveText("0");
});

test("shows a validation message for whitespace-only input", async ({ page }) => {
  await page.goto("/");

  await page.getByLabel("New task").fill("   ");
  await page.getByRole("button", { name: "Add Task" }).click();

  await expect(page.getByText("Enter a task before adding it.")).toBeVisible();
  await expect(page.locator('[data-testid="todo-item"]')).toHaveCount(0);
});

