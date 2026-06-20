import type { Expect, Locator, Page } from "@playwright/test";
import { getKanbanAddColumnPlaceholder, getKanbanColumn } from "./get-kanban-column";
import { getKanbanItem, getKanbanItemDragHandle } from "./get-kanban-item";

type DragBounds = { x: number; y: number; width: number; height: number };
type ItemTarget = { item: string; position: "before" | "after" };
type ColumnTarget = { column: string; position?: "top" | "bottom" | "inside" };
type TrashTarget = { trash: true };
type AddColumnTarget = { addColumnPlaceholder: true };
type DragItemTarget = ItemTarget | ColumnTarget | TrashTarget | AddColumnTarget;

export interface DragKanbanItemOptions {
  page: Page;
  expect: Expect;
  from: { name: string };
  to: DragItemTarget;
}

async function getBounds(locator: Locator): Promise<DragBounds> {
  await locator.scrollIntoViewIfNeeded();

  const bounds = await locator.boundingBox();

  if (!bounds) {
    throw new Error("Could not determine bounds for drag operation");
  }

  return bounds;
}

async function getItemDropCoordinates(
  page: Page,
  expect: Expect,
  fromBox: DragBounds,
  target: ItemTarget,
) {
  const targetItem = getKanbanItem(page, target.item);

  await expect(targetItem).toBeVisible();

  const targetBox = await getBounds(targetItem);
  const paddingY = 4;
  const draggingUp = fromBox.y > targetBox.y;
  const endX = targetBox.x + targetBox.width / 2;
  let endY =
    target.position === "before"
      ? targetBox.y + paddingY
      : targetBox.y + targetBox.height - paddingY;

  if (draggingUp) {
    endY += fromBox.height;
  }

  return { x: endX, y: endY };
}

async function getColumnDropCoordinates(
  page: Page,
  expect: Expect,
  target: ColumnTarget | AddColumnTarget,
) {
  const targetColumn =
    "addColumnPlaceholder" in target
      ? getKanbanAddColumnPlaceholder(page)
      : getKanbanColumn(page, target.column);

  await expect(targetColumn).toBeVisible();

  const targetBox = await getBounds(targetColumn);
  const position = "position" in target ? (target.position ?? "inside") : "inside";
  const endX = targetBox.x + targetBox.width / 2;
  let endY = targetBox.y + targetBox.height / 2;

  if (position === "top") {
    endY = targetBox.y + 24;
  }

  if (position === "bottom") {
    endY = targetBox.y + targetBox.height - 24;
  }

  return { x: endX, y: endY };
}

async function getTrashDropCoordinates(page: Page, expect: Expect) {
  const target = page.getByText("Drop here to delete", { exact: true });

  await expect(target).toBeVisible();

  const targetBox = await getBounds(target);

  return {
    x: targetBox.x + targetBox.width / 2,
    y: targetBox.y + targetBox.height / 2,
  };
}

async function getDropCoordinates(
  page: Page,
  expect: Expect,
  fromBox: DragBounds,
  target: DragItemTarget,
) {
  if ("item" in target) {
    return getItemDropCoordinates(page, expect, fromBox, target);
  }

  if ("trash" in target) {
    return getTrashDropCoordinates(page, expect);
  }

  return getColumnDropCoordinates(page, expect, target);
}

export async function dragKanbanItem({ page, expect, from, to }: DragKanbanItemOptions) {
  const fromHandle = getKanbanItemDragHandle(page, from.name);

  await expect(fromHandle).toBeVisible();

  const fromBox = await getBounds(fromHandle);
  const resolvedTarget = "trash" in to ? null : await getDropCoordinates(page, expect, fromBox, to);
  const startX = fromBox.x + fromBox.width / 2;
  const startY = fromBox.y + fromBox.height / 2;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + 8, startY + 8);
  await page.evaluate(() => new Promise(requestAnimationFrame));

  const target = resolvedTarget ?? (await getDropCoordinates(page, expect, fromBox, to));

  await page.mouse.move(target.x, target.y, { steps: 12 });
  await page.evaluate(() => new Promise(requestAnimationFrame));
  await page.waitForTimeout(120);
  await page.mouse.up();
  await page.waitForTimeout(120);

  if (!("trash" in to)) {
    await expect(getKanbanItem(page, from.name)).toHaveCount(1);
  }
}
