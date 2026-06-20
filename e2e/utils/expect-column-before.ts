import type { Expect, Page } from "@playwright/test";

export async function expectColumnBefore(
  page: Page,
  expect: Expect,
  beforeLabel: string,
  afterLabel: string,
) {
  const labels = await page
    .locator("[data-kanban-column-label]")
    .evaluateAll((nodes) => nodes.map((node) => node.textContent?.trim()));

  const beforeIndex = labels.indexOf(beforeLabel);
  const afterIndex = labels.indexOf(afterLabel);

  expect(beforeIndex).toBeGreaterThanOrEqual(0);
  expect(afterIndex).toBeGreaterThanOrEqual(0);
  expect(beforeIndex).toBeLessThan(afterIndex);
}
