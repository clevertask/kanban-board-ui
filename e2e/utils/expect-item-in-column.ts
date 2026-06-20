import type { Expect, Page } from "@playwright/test";
import { getKanbanColumn } from "./get-kanban-column";

export async function expectItemInColumn(
  page: Page,
  expect: Expect,
  itemName: string,
  columnName: string,
) {
  const column = getKanbanColumn(page, columnName);

  await expect(
    column.getByLabel(`Kanban item ${itemName}`, {
      exact: true,
    }),
  ).toHaveCount(1);
}

export async function expectItemNotInColumn(
  page: Page,
  expect: Expect,
  itemName: string,
  columnName: string,
) {
  const column = getKanbanColumn(page, columnName);

  await expect(
    column.getByLabel(`Kanban item ${itemName}`, {
      exact: true,
    }),
  ).toHaveCount(0);
}
