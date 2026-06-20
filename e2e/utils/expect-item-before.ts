import type { Expect, Locator, Page } from "@playwright/test";
import { getKanbanColumn } from "./get-kanban-column";

async function getItemLabels(scope: Locator | Page) {
  return scope
    .locator("[data-kanban-item-label]")
    .evaluateAll((nodes) => nodes.map((node) => node.textContent?.trim()));
}

export async function expectItemBefore(
  page: Page,
  expect: Expect,
  beforeLabel: string,
  afterLabel: string,
  options?: { column?: string },
) {
  const scope = options?.column ? getKanbanColumn(page, options.column) : page;
  const labels = await getItemLabels(scope);

  const beforeIndex = labels.indexOf(beforeLabel);
  const afterIndex = labels.indexOf(afterLabel);

  expect(beforeIndex).toBeGreaterThanOrEqual(0);
  expect(afterIndex).toBeGreaterThanOrEqual(0);
  expect(beforeIndex).toBeLessThan(afterIndex);
}
