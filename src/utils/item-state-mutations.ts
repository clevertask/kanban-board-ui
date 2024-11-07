import { UniqueIdentifier } from "@dnd-kit/core";
import { Items, DataItem } from "../components/KanbanBoard";

export function updateColumnItems(
  items: Items,
  columnId: UniqueIdentifier,
  updateFn: (currentState: DataItem[]) => DataItem[]
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

export function removeColumnItem(items: Items, columnId: UniqueIdentifier, itemId: UniqueIdentifier) {
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

export function removeColumn(items: Items, columnId: UniqueIdentifier) {
  return items.filter((column) => column.id !== columnId);
}

export function updateColumnName(items: Items, columnId: UniqueIdentifier, newName: string) {
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
