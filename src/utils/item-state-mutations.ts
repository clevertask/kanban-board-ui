import { UniqueIdentifier } from "@dnd-kit/core";
import { Columns, Item } from "../components/KanbanBoard";

export function updateColumnItems(
  items: Columns,
  columnId: UniqueIdentifier,
  updateFn: (currentState: Item[]) => Item[]
) {
  return items.map((column) => {
    if (column.id === columnId) {
      return {
        ...column,
        items: updateFn(column.items),
      };
    }
    return column;
  });
}

export function removeColumnItem(items: Columns, columnId: UniqueIdentifier, itemId: UniqueIdentifier) {
  return items.map((column) => {
    if (column.id === columnId) {
      return {
        ...column,
        items: column.items.filter((item) => item.id !== itemId),
      };
    }
    return column;
  });
}

export function removeColumn(items: Columns, columnId: UniqueIdentifier) {
  return items.filter((column) => column.id !== columnId);
}

export function updateColumnName(items: Columns, columnId: UniqueIdentifier, newName: string) {
  return items.map((column) => {
    if (column.id === columnId) {
      return {
        ...column,
        name: newName,
      };
    }
    return column;
  });
}
