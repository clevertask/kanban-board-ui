import type { Expect, Locator, Page } from "@playwright/test";
import { getKanbanColumn, getKanbanColumnDragHandle } from "./get-kanban-column";

type DragBounds = { x: number; y: number; width: number; height: number };

export interface DragKanbanColumnOptions {
  page: Page;
  expect: Expect;
  from: { name: string };
  to: { column: string; position?: "before" | "after" };
}

async function getBounds(locator: Locator): Promise<DragBounds> {
  const bounds = await locator.boundingBox();

  if (!bounds) {
    throw new Error("Could not determine bounds for drag operation");
  }

  return bounds;
}

export async function dragKanbanColumn({ page, expect, from, to }: DragKanbanColumnOptions) {
  const fromHandle = getKanbanColumnDragHandle(page, from.name);
  const targetColumn = getKanbanColumn(page, to.column);

  await expect(fromHandle).toBeVisible();
  await expect(targetColumn).toBeVisible();

  const fromBox = await getBounds(fromHandle);
  const targetBox = await getBounds(targetColumn);
  const startX = fromBox.x + fromBox.width / 2;
  const startY = fromBox.y + fromBox.height / 2;
  const endX =
    to.position === "after" ? targetBox.x + targetBox.width - 8 : targetBox.x + 8 + fromBox.width;
  const endY = targetBox.y + fromBox.height / 2;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + 1, startY + 1);
  await page.mouse.move(endX, endY, { steps: 12 });
  await page.evaluate(() => new Promise(requestAnimationFrame));
  await page.waitForTimeout(120);
  await page.mouse.up();
  await page.waitForTimeout(120);
  await expect(getKanbanColumn(page, from.name)).toHaveCount(1);
}
