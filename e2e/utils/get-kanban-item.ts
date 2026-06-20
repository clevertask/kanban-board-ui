import type { Locator, Page } from "@playwright/test";

export function getKanbanItem(page: Page, name: string, options?: { exact?: boolean }): Locator {
  return page.getByLabel(`Kanban item ${name}`, {
    exact: options?.exact ?? true,
  });
}

export function getKanbanItemDragHandle(
  page: Page,
  name: string,
  options?: { exact?: boolean },
): Locator {
  return page.getByLabel(`Drag item ${name}`, {
    exact: options?.exact ?? true,
  });
}
