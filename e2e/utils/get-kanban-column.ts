import type { Locator, Page } from "@playwright/test";

export function getKanbanColumn(page: Page, name: string, options?: { exact?: boolean }): Locator {
  return page.getByLabel(`Kanban column ${name}`, {
    exact: options?.exact ?? true,
  });
}

export function getKanbanColumnDragHandle(
  page: Page,
  name: string,
  options?: { exact?: boolean },
): Locator {
  return page.getByLabel(`Drag column ${name}`, {
    exact: options?.exact ?? true,
  });
}

export function getKanbanAddColumnPlaceholder(page: Page): Locator {
  return page.getByLabel("Kanban add column placeholder", { exact: true });
}
