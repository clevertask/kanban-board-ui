import { Data, DataItem } from "../components/KanbanBoard";

export function updateColumnItems(items: Data, columnId: string, updateFn: (currentState: DataItem[]) => DataItem[]) {
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

export function removeColumnItem(items: Data, columnId: string, itemId: string) {
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

export function removeColumn(items: Data, columnId: string) {
  return items.filter((column) => column.id !== columnId);
}

export function updateColumnName(items: Data, columnId: string, newName: string) {
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
