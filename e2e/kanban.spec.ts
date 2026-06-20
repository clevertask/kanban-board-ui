import { test, expect } from "@playwright/test";
import {
  dragKanbanColumn,
  dragKanbanItem,
  expectColumnBefore,
  expectItemBefore,
  expectItemInColumn,
  expectItemNotInColumn,
  getKanbanItem,
} from "./utils";

test.afterEach(async ({ page }) => {
  await page.getByRole("button", { name: "Reset board", exact: true }).click();
});

test("Item can be reordered within its column after drag and drop", async ({ page }) => {
  await page.goto("/");

  await dragKanbanItem({
    page,
    expect,
    from: { name: "Create mobile modal" },
    to: { item: "Write API contract", position: "before" },
  });

  await expectItemBefore(page, expect, "Create mobile modal", "Write API contract", {
    column: "To Do",
  });
  await expectItemInColumn(page, expect, "Create mobile modal", "To Do");
});

test("Item can move to another non-empty column after drag and drop", async ({ page }) => {
  await page.goto("/");

  await dragKanbanItem({
    page,
    expect,
    from: { name: "Write API contract" },
    to: { item: "Ship docs", position: "after" },
  });

  await expectItemInColumn(page, expect, "Write API contract", "Done");
  await expectItemNotInColumn(page, expect, "Write API contract", "To Do");
  await expectItemBefore(page, expect, "Ship docs", "Write API contract", {
    column: "Done",
  });
});

test("Item can move into an empty column after drag and drop", async ({ page }) => {
  await page.goto("/");

  await dragKanbanItem({
    page,
    expect,
    from: { name: "Create mobile modal" },
    to: { column: "QA", position: "inside" },
  });

  await expectItemInColumn(page, expect, "Create mobile modal", "QA");
  await expectItemNotInColumn(page, expect, "Create mobile modal", "To Do");
});

test("Column can be reordered after drag and drop", async ({ page }) => {
  await page.goto("/");

  await dragKanbanColumn({
    page,
    expect,
    from: { name: "Done" },
    to: { column: "To Do", position: "before" },
  });

  await expectColumnBefore(page, expect, "Done", "To Do");
});

test("Item can be removed by dragging it to trash", async ({ page }) => {
  await page.goto("/");

  await dragKanbanItem({
    page,
    expect,
    from: { name: "Implement helpers" },
    to: { trash: true },
  });

  await expect(getKanbanItem(page, "Implement helpers")).toHaveCount(0);
});
