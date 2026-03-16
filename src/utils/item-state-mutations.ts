import { UniqueIdentifier } from "@dnd-kit/core";
import type { Columns, MovedItemState } from "../components/KanbanBoard";

type ColumnItem<T> = Columns<T>[number]["items"][number];
export type ItemMoveMutationResult<T> = {
  columns: Columns<T>;
  result: MovedItemState | null;
};
export type ColumnMoveState = {
  columnId: UniqueIdentifier;
  newIndex: number;
  beforeItemId: UniqueIdentifier | null;
  afterItemId: UniqueIdentifier | null;
};
export type ColumnMoveMutationResult<T> = {
  columns: Columns<T>;
  result: ColumnMoveState | null;
};
export type BulkItemMoveMutationResult<T> = {
  columns: Columns<T>;
  /**
   * Ordered the same way the caller should persist the operations.
   * For `moveItemsBefore`, this is intentionally reverse visual order so
   * each subsequent move can anchor to the item that was just positioned.
   */
  results: MovedItemState[];
};

export function updateColumnItems<T>(
  items: Columns<T>,
  columnId: UniqueIdentifier,
  updateFn: (currentState: ColumnItem<T>[]) => ColumnItem<T>[],
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

export function removeColumnItem<T>(
  items: Columns<T>,
  columnId: UniqueIdentifier,
  itemId: UniqueIdentifier,
) {
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

export function removeColumn<T>(items: Columns<T>, columnId: UniqueIdentifier) {
  return items.filter((column) => column.id !== columnId);
}

export function updateColumnName<T>(
  items: Columns<T>,
  columnId: UniqueIdentifier,
  newName: string,
) {
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

function findItemLocation<T>(
  columns: Columns<T>,
  itemId: UniqueIdentifier,
): { columnIndex: number; itemIndex: number } | null {
  for (let columnIndex = 0; columnIndex < columns.length; columnIndex++) {
    const itemIndex = columns[columnIndex].items.findIndex((item) => item.id === itemId);

    if (itemIndex !== -1) {
      return { columnIndex, itemIndex };
    }
  }

  return null;
}

function clampIndex(index: number, max: number) {
  return Math.max(0, Math.min(index, max));
}

function getOrderedUniqueItemIdsInVisualOrder<T>(
  columns: Columns<T>,
  itemIds: UniqueIdentifier[],
): UniqueIdentifier[] {
  const requestedIds = new Set(itemIds);
  const seenIds = new Set<UniqueIdentifier>();
  const orderedIds: UniqueIdentifier[] = [];

  for (const column of columns) {
    for (const item of column.items) {
      if (!requestedIds.has(item.id) || seenIds.has(item.id)) {
        continue;
      }

      seenIds.add(item.id);
      orderedIds.push(item.id);
    }
  }

  return orderedIds;
}

function getAdjacentItemIds<T>(
  items: ColumnItem<T>[],
  index: number,
): Pick<MovedItemState, "beforeItemId" | "afterItemId"> {
  return {
    beforeItemId: items[index - 1]?.id ?? null,
    afterItemId: items[index + 1]?.id ?? null,
  };
}

function getAdjacentColumnIds<T>(
  columns: Columns<T>,
  index: number,
): Pick<ColumnMoveState, "beforeItemId" | "afterItemId"> {
  return {
    beforeItemId: columns[index - 1]?.id ?? null,
    afterItemId: columns[index + 1]?.id ?? null,
  };
}

/**
 * Moves an item to a given column and inserts it at `targetIndex`.
 *
 * - `targetIndex` is interpreted against the target column before mutation.
 * - When omitted, the item is appended to the end of the target column.
 */
export function moveItemToColumn<T>(
  columns: Columns<T>,
  itemId: UniqueIdentifier,
  targetColumnId: UniqueIdentifier,
  targetIndex?: number,
): ItemMoveMutationResult<T> {
  const sourceLocation = findItemLocation(columns, itemId);
  const targetColumnIndex = columns.findIndex((column) => column.id === targetColumnId);

  if (!sourceLocation || targetColumnIndex === -1) {
    return {
      columns,
      result: null,
    };
  }

  const sourceColumn = columns[sourceLocation.columnIndex];
  const sourceItems = [...sourceColumn.items];
  const [movedItem] = sourceItems.splice(sourceLocation.itemIndex, 1);

  if (!movedItem) {
    return {
      columns,
      result: null,
    };
  }

  if (sourceLocation.columnIndex === targetColumnIndex) {
    let insertionIndex = targetIndex ?? sourceItems.length;

    if (targetIndex !== undefined && sourceLocation.itemIndex < insertionIndex) {
      insertionIndex -= 1;
    }

    insertionIndex = clampIndex(insertionIndex, sourceItems.length);

    if (insertionIndex === sourceLocation.itemIndex) {
      return {
        columns,
        result: null,
      };
    }

    sourceItems.splice(insertionIndex, 0, movedItem);

    const nextColumns = columns.map((column, index) =>
      index === sourceLocation.columnIndex ? { ...column, items: sourceItems } : column,
    );

    return {
      columns: nextColumns,
      result: {
        itemId,
        sourceColumnId: sourceColumn.id,
        targetColumnId: targetColumnId,
        newIndex: insertionIndex,
        hasEnded: true,
        ...getAdjacentItemIds(sourceItems, insertionIndex),
      },
    };
  }

  const targetItems = [...columns[targetColumnIndex].items];
  const insertionIndex = clampIndex(targetIndex ?? targetItems.length, targetItems.length);

  targetItems.splice(insertionIndex, 0, movedItem);

  const nextColumns = columns.map((column, index) => {
    if (index === sourceLocation.columnIndex) {
      return {
        ...column,
        items: sourceItems,
      };
    }

    if (index === targetColumnIndex) {
      return {
        ...column,
        items: targetItems,
      };
    }

    return column;
  });

  return {
    columns: nextColumns,
    result: {
      itemId,
      sourceColumnId: sourceColumn.id,
      targetColumnId: targetColumnId,
      newIndex: insertionIndex,
      hasEnded: true,
      ...getAdjacentItemIds(targetItems, insertionIndex),
    },
  };
}

/**
 * Moves `sourceItemId` before `targetItemId`.
 */
export function moveItemBefore<T>(
  columns: Columns<T>,
  sourceItemId: UniqueIdentifier,
  targetItemId: UniqueIdentifier,
): ItemMoveMutationResult<T> {
  if (sourceItemId === targetItemId) {
    return {
      columns,
      result: null,
    };
  }

  const targetLocation = findItemLocation(columns, targetItemId);

  if (!targetLocation) {
    return {
      columns,
      result: null,
    };
  }

  const targetColumnId = columns[targetLocation.columnIndex].id;

  return moveItemToColumn(columns, sourceItemId, targetColumnId, targetLocation.itemIndex);
}

/**
 * Moves `sourceItemId` after `targetItemId`.
 */
export function moveItemAfter<T>(
  columns: Columns<T>,
  sourceItemId: UniqueIdentifier,
  targetItemId: UniqueIdentifier,
): ItemMoveMutationResult<T> {
  if (sourceItemId === targetItemId) {
    return {
      columns,
      result: null,
    };
  }

  const targetLocation = findItemLocation(columns, targetItemId);

  if (!targetLocation) {
    return {
      columns,
      result: null,
    };
  }

  const targetColumnId = columns[targetLocation.columnIndex].id;

  return moveItemToColumn(columns, sourceItemId, targetColumnId, targetLocation.itemIndex + 1);
}

function moveItemsRelative<T>(
  columns: Columns<T>,
  sourceItemIds: UniqueIdentifier[],
  targetItemId: UniqueIdentifier,
  position: "before" | "after",
): BulkItemMoveMutationResult<T> {
  if (!findItemLocation(columns, targetItemId)) {
    return {
      columns,
      results: [],
    };
  }

  const orderedSourceItemIds = getOrderedUniqueItemIdsInVisualOrder(columns, sourceItemIds).filter(
    (itemId) => itemId !== targetItemId,
  );

  if (!orderedSourceItemIds.length) {
    return {
      columns,
      results: [],
    };
  }

  let nextColumns = columns;
  const results: MovedItemState[] = [];

  if (position === "before") {
    let anchorItemId = targetItemId;

    for (let index = orderedSourceItemIds.length - 1; index >= 0; index -= 1) {
      const itemId = orderedSourceItemIds[index];
      const moveResult = moveItemBefore(nextColumns, itemId, anchorItemId);

      nextColumns = moveResult.columns;
      if (moveResult.result) {
        results.push(moveResult.result);
      }

      anchorItemId = itemId;
    }
  } else {
    let anchorItemId = targetItemId;

    for (const itemId of orderedSourceItemIds) {
      const moveResult = moveItemAfter(nextColumns, itemId, anchorItemId);

      nextColumns = moveResult.columns;
      if (moveResult.result) {
        results.push(moveResult.result);
      }

      anchorItemId = itemId;
    }
  }

  return {
    columns: nextColumns,
    results,
  };
}

/**
 * Moves `sourceItemIds` as a visual block before `targetItemId`.
 *
 * Results are returned in the order they should be persisted. This means the
 * returned `results` array is intentionally reverse visual order when moving
 * items before a target.
 */
export function moveItemsBefore<T>(
  columns: Columns<T>,
  sourceItemIds: UniqueIdentifier[],
  targetItemId: UniqueIdentifier,
): BulkItemMoveMutationResult<T> {
  return moveItemsRelative(columns, sourceItemIds, targetItemId, "before");
}

/**
 * Moves `sourceItemIds` as a visual block after `targetItemId`.
 *
 * Results are returned in the order they should be persisted.
 */
export function moveItemsAfter<T>(
  columns: Columns<T>,
  sourceItemIds: UniqueIdentifier[],
  targetItemId: UniqueIdentifier,
): BulkItemMoveMutationResult<T> {
  return moveItemsRelative(columns, sourceItemIds, targetItemId, "after");
}

function moveColumnRelative<T>(
  columns: Columns<T>,
  sourceColumnId: UniqueIdentifier,
  targetColumnId: UniqueIdentifier,
  position: "before" | "after",
): ColumnMoveMutationResult<T> {
  if (sourceColumnId === targetColumnId) {
    return {
      columns,
      result: null,
    };
  }

  const sourceIndex = columns.findIndex((column) => column.id === sourceColumnId);
  const targetIndex = columns.findIndex((column) => column.id === targetColumnId);

  if (sourceIndex === -1 || targetIndex === -1) {
    return {
      columns,
      result: null,
    };
  }

  const updatedColumns = [...columns];
  const [sourceColumn] = updatedColumns.splice(sourceIndex, 1);

  if (!sourceColumn) {
    return {
      columns,
      result: null,
    };
  }

  const newTargetIndex = updatedColumns.findIndex((column) => column.id === targetColumnId);

  if (newTargetIndex === -1) {
    return {
      columns,
      result: null,
    };
  }

  const insertionIndex = position === "before" ? newTargetIndex : newTargetIndex + 1;

  updatedColumns.splice(insertionIndex, 0, sourceColumn);

  return {
    columns: updatedColumns,
    result: {
      columnId: sourceColumnId,
      newIndex: insertionIndex,
      ...getAdjacentColumnIds(updatedColumns, insertionIndex),
    },
  };
}

/**
 * Moves `sourceColumnId` before `targetColumnId`.
 */
export function moveColumnBefore<T>(
  columns: Columns<T>,
  sourceColumnId: UniqueIdentifier,
  targetColumnId: UniqueIdentifier,
): ColumnMoveMutationResult<T> {
  return moveColumnRelative(columns, sourceColumnId, targetColumnId, "before");
}

/**
 * Moves `sourceColumnId` after `targetColumnId`.
 */
export function moveColumnAfter<T>(
  columns: Columns<T>,
  sourceColumnId: UniqueIdentifier,
  targetColumnId: UniqueIdentifier,
): ColumnMoveMutationResult<T> {
  return moveColumnRelative(columns, sourceColumnId, targetColumnId, "after");
}
