import type { Locator, Page } from "@playwright/test";

export function getKanbanItem(
  scope: Locator | Page,
  name: string,
  options?: { exact?: boolean },
): Locator {
  return scope.getByLabel(`Kanban item ${name}`, {
    exact: options?.exact ?? true,
  });
}

export function getKanbanItemDragHandle(
  scope: Locator | Page,
  name: string,
  options?: { exact?: boolean },
): Locator {
  return scope.getByLabel(`Drag item ${name}`, {
    exact: options?.exact ?? true,
  });
}
