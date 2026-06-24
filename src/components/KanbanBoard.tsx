/* eslint-disable react-hooks/refs */

import React, { Dispatch, SetStateAction, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Modifiers, Sensors, UniqueIdentifier } from "@dnd-kit/abstract";
import { CollisionPriority } from "@dnd-kit/abstract";
import { directionBiased } from "@dnd-kit/collision";
import { DragDropProvider, DragOverlay, useDroppable, type DragDropManager } from "@dnd-kit/react";
import {
  PointerActivationConstraints,
  PointerSensor,
  type DragEndEvent,
  type DragOverEvent,
  type DropAnimation,
} from "@dnd-kit/dom";
import { useSortable } from "@dnd-kit/react/sortable";
import { move } from "@dnd-kit/helpers";
import type { ColumnMoveState } from "../utils/item-state-mutations";
import { Item } from "./Item";
import { Container, ContainerProps } from "./Container";
import { ItemProps } from "./Item/Item";

const COLUMN_GROUP = "kanban-columns";
const COLUMN_TYPE = "kanban-column";
const ITEM_TYPE = "kanban-item";

type KanbanBoardActivationTolerance =
  | number
  | { x: number; y: number }
  | { x: number }
  | { y: number };
type KanbanBoardDistanceActivationConstraint = {
  distance: number;
  tolerance?: KanbanBoardActivationTolerance;
};
type KanbanBoardDelayActivationConstraint = {
  delay: number;
  tolerance: KanbanBoardActivationTolerance;
};
type KanbanBoardActivationConstraint =
  | KanbanBoardDistanceActivationConstraint
  | KanbanBoardDelayActivationConstraint;
type DragListeners = Partial<React.ComponentPropsWithRef<"button">>;
type ItemStyleArgs = {
  value: UniqueIdentifier;
  index: number;
  overIndex: number;
  isDragging: boolean;
  containerId: UniqueIdentifier;
  isSorting: boolean;
  isDragOverlay: boolean;
};

type DroppableContainerBaseProps = ContainerProps & {
  dragDisabled?: boolean;
  id: UniqueIdentifier;
  index: number;
  itemCount: number;
  style?: React.CSSProperties;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columnMetadata: any;
  renderColumn: Props["renderColumn"];
};

function DroppableContainer(props: DroppableContainerBaseProps) {
  if (props.id === PLACEHOLDER_ID) {
    return <AddColumnDroppableContainer {...props} />;
  }

  return <SortableDroppableContainer {...props} />;
}

function SortableDroppableContainer({
  children,
  dragDisabled,
  id,
  index,
  itemCount,
  style,
  renderColumn,
  columnMetadata,
  ...props
}: DroppableContainerBaseProps) {
  const isEmptyColumn = itemCount === 0;
  const { handleRef, isDragging, isDropTarget, ref } = useSortable({
    id,
    index,
    group: COLUMN_GROUP,
    type: COLUMN_TYPE,
    accept: [COLUMN_TYPE, ITEM_TYPE],
    collisionDetector: isEmptyColumn ? directionBiased : undefined,
    disabled: {
      draggable: Boolean(dragDisabled),
      droppable: false,
    },
    collisionPriority: isEmptyColumn ? CollisionPriority.High : CollisionPriority.Low,
  });
  const containerStyle = {
    ...style,
    opacity: isDragging ? 0.5 : undefined,
  };
  const dragListeners = {
    ref: handleRef,
  };

  return renderColumn ? (
    renderColumn({
      id,
      label: props.label,
      columnMetadata,
      children,
      ref,
      dragListeners,
      attributes: {},
      style: containerStyle,
      isDragging,
      isOver: isDropTarget,
      isColumnPlaceholder: id === PLACEHOLDER_ID,
    })
  ) : (
    <Container
      ref={ref}
      style={containerStyle}
      hover={isDropTarget}
      handleProps={dragListeners}
      {...props}
    >
      {children}
    </Container>
  );
}

function AddColumnDroppableContainer({
  children,
  id,
  style,
  renderColumn,
  columnMetadata,
  ...props
}: DroppableContainerBaseProps) {
  const { isDropTarget, ref } = useDroppable({
    id,
    accept: ITEM_TYPE,
    type: COLUMN_TYPE,
    collisionPriority: CollisionPriority.Low,
  });

  return renderColumn ? (
    renderColumn({
      id,
      label: props.label,
      columnMetadata,
      children,
      ref,
      dragListeners: {},
      attributes: {},
      style,
      isDragging: false,
      isOver: isDropTarget,
      isColumnPlaceholder: true,
    })
  ) : (
    <Container ref={ref} style={style} hover={isDropTarget} handleProps={{}} {...props}>
      {children}
    </Container>
  );
}

const dropAnimation: DropAnimation = {
  duration: 200,
};

export type BaseItem = { id: UniqueIdentifier; name?: string };
export type Item<ExtendedProps = BaseItem> = BaseItem & ExtendedProps;
export type Columns<T = Item> = {
  id: UniqueIdentifier;
  name?: string;
  items: Item<T>[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: any;
}[];
export type KanbanBoardDragActivationConstraints = {
  /**
   * Mouse activation constraint. Omit to use the dnd-kit default.
   */
  mouse?: KanbanBoardActivationConstraint | null;

  /**
   * Touch activation constraint. Omit to use the dnd-kit default.
   */
  touch?: KanbanBoardActivationConstraint | null;
};
export type TOnAddColumnArgs = {
  item: Item | null;
  fromContainer: UniqueIdentifier;
} | null;
export type TOnItemRemoveArgs = {
  itemId: UniqueIdentifier;
  fromContainer: UniqueIdentifier;
};
export interface MovedItemState {
  itemId: UniqueIdentifier;
  newIndex: number;
  sourceColumnId: UniqueIdentifier;
  targetColumnId: UniqueIdentifier;
  hasEnded: boolean;
  beforeItemId?: UniqueIdentifier | null;
  afterItemId?: UniqueIdentifier | null;
}
export type ColumnRenderArgs = {
  id: UniqueIdentifier;
  label: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columnMetadata: any;
  children: React.ReactNode;
  ref: ((node: HTMLElement | null) => void) | undefined;
  dragListeners: DragListeners;
  attributes: React.HTMLAttributes<HTMLElement>;
  style?: React.CSSProperties;
  isDragging: boolean;
  isOver: boolean;
  isColumnPlaceholder: boolean;
  onEdit?: () => void;
};
export interface Props<ExtendedItem = Item> {
  adjustScale?: boolean;
  cancelDrop?: unknown;
  containerStyle?: React.CSSProperties;
  /**
   * Optional DOM container for the drag overlay portal.
   * Defaults to document.body when omitted.
   */
  dragOverlayPortalContainer?: Element | DocumentFragment | null;
  /**
   * Optional drag activation constraints for pointer-based sensors.
   * When omitted, dnd-kit owns the default pointer activation behavior.
   */
  dragActivationConstraints?: KanbanBoardDragActivationConstraints;
  coordinateGetter?: unknown;
  getItemStyles?(args: ItemStyleArgs): React.CSSProperties;
  wrapperStyle?(args: { index: number }): React.CSSProperties;
  onItemMove(result: MovedItemState): void;
  onColumnMove?(result: ColumnMoveState): void;
  onAddColumn?(item: TOnAddColumnArgs): void;
  onColumnEdit?(columnId: UniqueIdentifier): void;
  onItemClick?(itemId: UniqueIdentifier): void;
  itemCount?: number;
  columns: Columns<ExtendedItem>;
  setColumns: Dispatch<SetStateAction<Columns<ExtendedItem>>>;
  handle?: boolean;
  renderItem?: ItemProps<ExtendedItem>["renderItem"];
  renderColumn?: (args: ColumnRenderArgs) => React.ReactElement;
  strategy?: unknown;
  modifiers?: Modifiers<DragDropManager>;
  minimal?: boolean;
  trashable?: boolean;
  onItemRemove?(result: TOnItemRemoveArgs): void;
  scrollable?: boolean;
  vertical?: boolean;
}

export const TRASH_ID = "void";
const PLACEHOLDER_ID = "placeholder";

export function KanbanBoard<T = Item>({
  columns,
  setColumns,
  handle = true,
  containerStyle,
  getItemStyles = () => ({}),
  wrapperStyle = () => ({}),
  minimal = false,
  modifiers,
  renderItem,
  renderColumn,
  trashable = false,
  onItemRemove,
  vertical = false,
  scrollable,
  onItemMove,
  onColumnMove,
  onAddColumn,
  onColumnEdit,
  onItemClick,
  dragOverlayPortalContainer,
  dragActivationConstraints,
}: Props<T>) {
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [activeType, setActiveType] = useState<unknown>();
  const clonedColumnsRef = useRef<Columns<T> | null>(null);
  const columnsRef = useRef(columns);
  const dragSourceContainerRef = useRef<UniqueIdentifier | null>(null);
  const onItemMoveRef = useRef(onItemMove);
  const onColumnMoveRef = useRef(onColumnMove);
  const onItemRemoveRef = useRef(onItemRemove);
  const onAddColumnRef = useRef(onAddColumn);

  useEffect(() => {
    columnsRef.current = columns;
  }, [columns]);

  useEffect(() => {
    onItemMoveRef.current = onItemMove;
  }, [onItemMove]);

  useEffect(() => {
    onColumnMoveRef.current = onColumnMove;
  }, [onColumnMove]);

  useEffect(() => {
    onItemRemoveRef.current = onItemRemove;
  }, [onItemRemove]);

  useEffect(() => {
    onAddColumnRef.current = onAddColumn;
  }, [onAddColumn]);

  const isSortingContainer = activeType === COLUMN_TYPE;
  const sensors = useMemo(
    () => getConfiguredSensors(dragActivationConstraints),
    [dragActivationConstraints],
  );

  const findItem = (id: UniqueIdentifier, items = columnsRef.current) => {
    for (const column of items) {
      const item = column.items.find((item) => item.id === id);
      if (item) {
        return item;
      }
    }

    return null;
  };

  const findContainer = (id: UniqueIdentifier, items = columnsRef.current) => {
    const column = items.find((i) => i.id === id);
    if (column) {
      return column.id;
    }
    for (const column of items) {
      if (column.items.some((item) => item.id === id)) {
        return column.id;
      }
    }

    return null;
  };

  const getIndex = (id: UniqueIdentifier, items = columnsRef.current) => {
    const containerId = findContainer(id, items);
    if (!containerId) return -1;

    const column = items.find((col) => col.id === containerId);
    return column ? column.items.findIndex((item) => item.id === id) : -1;
  };

  const cleanupDragState = () => {
    setActiveId(null);
    setActiveType(undefined);
    clonedColumnsRef.current = null;
    dragSourceContainerRef.current = null;
  };

  const commitColumns = (nextColumns: Columns<T>) => {
    columnsRef.current = nextColumns;
    setColumns(nextColumns);
  };

  const renderOverlay = (
    <DragOverlay dropAnimation={dropAnimation}>
      {(source) =>
        source.type === COLUMN_TYPE
          ? renderContainerDragOverlay(source.id)
          : renderSortableItemDragOverlay(source.id)
      }
    </DragOverlay>
  );

  return (
    <DragDropProvider
      sensors={sensors}
      modifiers={modifiers}
      onDragStart={(event) => {
        const source = event.operation.source;

        setActiveId(source?.id ?? null);
        setActiveType(source?.type);
        clonedColumnsRef.current = columnsRef.current;
        dragSourceContainerRef.current =
          source?.type === ITEM_TYPE ? findContainer(source.id) : null;
      }}
      onDragOver={(event) => {
        const { source, target } = event.operation;

        if (source?.type !== ITEM_TYPE || !target) {
          return;
        }

        if (target.id === TRASH_ID || target.id === PLACEHOLDER_ID) {
          return;
        }

        const sourceColumnId = findContainer(source.id);
        const targetColumnId = findContainer(target.id);

        if (!sourceColumnId || !targetColumnId || sourceColumnId === targetColumnId) {
          return;
        }

        const nextColumns = moveItemsInColumns(columnsRef.current, event);

        if (nextColumns !== columnsRef.current) {
          commitColumns(nextColumns);
        }
      }}
      onDragEnd={(event) => {
        const { canceled, operation } = event;
        const { source, target } = operation;

        if (canceled) {
          if (clonedColumnsRef.current) {
            commitColumns(clonedColumnsRef.current);
          }
          cleanupDragState();
          return;
        }

        if (!source || !target) {
          cleanupDragState();
          return;
        }

        if (source.type === COLUMN_TYPE) {
          if (target.id === PLACEHOLDER_ID) {
            cleanupDragState();
            return;
          }

          const nextColumns = moveColumns(columnsRef.current, event);
          const newIndex = nextColumns.findIndex((column) => column.id === source.id);

          if (newIndex !== -1) {
            commitColumns(nextColumns);
            onColumnMoveRef.current?.({
              columnId: source.id,
              newIndex,
              ...getAdjacentColumnIds(nextColumns, newIndex),
            });
          }

          cleanupDragState();
          return;
        }

        if (source.type === ITEM_TYPE) {
          const sourceColumnId =
            dragSourceContainerRef.current ??
            findContainer(source.id, clonedColumnsRef.current ?? columnsRef.current);

          if (!sourceColumnId) {
            cleanupDragState();
            return;
          }

          if (target.id === TRASH_ID) {
            if (clonedColumnsRef.current) {
              commitColumns(clonedColumnsRef.current);
            }

            onItemRemoveRef.current?.({
              itemId: source.id,
              fromContainer: sourceColumnId,
            });
            cleanupDragState();
            return;
          }

          if (target.id === PLACEHOLDER_ID) {
            if (clonedColumnsRef.current) {
              commitColumns(clonedColumnsRef.current);
            }

            const itemToAdd = {
              item: findItem(source.id),
              fromContainer: sourceColumnId,
            };

            onAddColumnRef.current?.(itemToAdd);
            cleanupDragState();
            return;
          }

          const baseColumns = clonedColumnsRef.current ?? columnsRef.current;
          const nextColumns = moveItemsInColumns(baseColumns, event);

          if (nextColumns !== columnsRef.current) {
            commitColumns(nextColumns);
          }

          const targetColumnId = findContainer(source.id, nextColumns);
          const newIndex = getIndex(source.id, nextColumns);
          const targetColumn = nextColumns.find((column) => column.id === targetColumnId);

          if (targetColumnId && targetColumn && newIndex !== -1) {
            onItemMoveRef.current({
              itemId: source.id,
              sourceColumnId,
              targetColumnId,
              newIndex,
              hasEnded: true,
              ...getAdjacentItemIds(targetColumn.items, newIndex),
            });
          }
        }

        cleanupDragState();
      }}
    >
      <div
        style={{
          display: "inline-grid",
          boxSizing: "border-box",
          padding: 20,
          gridAutoFlow: vertical ? "row" : "column",
        }}
      >
        {columns.map(({ id: containerId, name, items, metadata }, index) => (
          <DroppableContainer
            key={containerId}
            id={containerId}
            index={index}
            itemCount={items.length}
            label={name ?? String(containerId)}
            scrollable={scrollable}
            style={containerStyle}
            unstyled={minimal}
            dragDisabled={isSortingContainer}
            onEdit={() => onColumnEdit?.(containerId)}
            renderColumn={renderColumn}
            columnMetadata={metadata}
          >
            {items.map((item, itemIndex) => {
              const { id: value, name } = item;
              return (
                <SortableItem<T>
                  disabled={isSortingContainer}
                  key={value}
                  id={value}
                  content={name ?? String(value)}
                  item={item}
                  index={itemIndex}
                  handle={handle}
                  style={getItemStyles}
                  wrapperStyle={wrapperStyle}
                  renderItem={renderItem}
                  containerId={containerId}
                  isSorting={Boolean(activeId)}
                  getIndex={getIndex}
                  onItemClick={() => onItemClick?.(value)}
                />
              );
            })}
          </DroppableContainer>
        ))}
        {!onAddColumn ? undefined : (
          <DroppableContainer
            id={PLACEHOLDER_ID}
            index={columns.length}
            itemCount={0}
            label=""
            dragDisabled
            onClick={() => onAddColumn?.(null)}
            renderColumn={renderColumn}
            columnMetadata={undefined}
            placeholder
          >
            + Add column
          </DroppableContainer>
        )}
      </div>
      {createPortal(renderOverlay, dragOverlayPortalContainer ?? document.body)}
      {trashable && activeId && activeType === ITEM_TYPE ? <Trash id={TRASH_ID} /> : null}
    </DragDropProvider>
  );

  function renderSortableItemDragOverlay(id: UniqueIdentifier) {
    const item = findItem(id) || "";
    if (!item) return null;
    return (
      <Item
        value={id}
        handle={handle}
        content={item.name ?? String(id)}
        item={item}
        style={getItemStyles({
          containerId: findContainer(id) as UniqueIdentifier,
          overIndex: -1,
          index: getIndex(id),
          value: id,
          isSorting: true,
          isDragging: true,
          isDragOverlay: true,
        })}
        color={getColor(id)}
        wrapperStyle={wrapperStyle({ index: 0 })}
        renderItem={renderItem as ItemProps["renderItem"]}
        dragOverlay
      />
    );
  }

  function renderContainerDragOverlay(containerId: UniqueIdentifier) {
    const column = columnsRef.current.find((i) => i.id === containerId);
    if (!column) return null;

    const children = column.items.map((item, index) => (
      <Item
        key={item.id}
        value={item.id}
        content={item.name ?? String(item.id)}
        handle={handle}
        style={getItemStyles({
          containerId,
          overIndex: -1,
          index: getIndex(item.id),
          value: item.id,
          isDragging: false,
          isSorting: false,
          isDragOverlay: false,
        })}
        item={item}
        color={getColor(item.id)}
        wrapperStyle={wrapperStyle({ index })}
        renderItem={renderItem as ItemProps["renderItem"]}
      />
    ));

    if (renderColumn) {
      return renderColumn({
        id: column.id,
        label: column.name ?? String(column.id),
        columnMetadata: column.metadata,
        children,
        ref: undefined,
        dragListeners: {},
        attributes: {},
        style: {
          height: "100%",
          opacity: 0.8,
        },
        isDragging: true,
        isOver: false,
        isColumnPlaceholder: false,
        onEdit: undefined,
      });
    }

    return (
      <Container
        label={column.name ?? String(column.id)}
        style={{
          height: "100%",
        }}
        shadow
        unstyled={false}
      >
        {children}
      </Container>
    );
  }
}

function getConfiguredSensors(dragActivationConstraints?: KanbanBoardDragActivationConstraints) {
  if (!dragActivationConstraints) {
    return undefined;
  }

  return (defaults: Sensors<DragDropManager>): Sensors<DragDropManager> =>
    defaults.map((sensor) =>
      sensor === PointerSensor
        ? PointerSensor.configure({
            activationConstraints: (event) =>
              getPointerActivationConstraints(event, dragActivationConstraints),
          })
        : sensor,
    );
}

function getPointerActivationConstraints(
  event: PointerEvent,
  dragActivationConstraints: KanbanBoardDragActivationConstraints,
) {
  const constraint =
    event.pointerType === "mouse"
      ? dragActivationConstraints.mouse
      : event.pointerType === "touch"
        ? dragActivationConstraints.touch
        : undefined;

  if (!constraint) {
    return undefined;
  }

  if ("distance" in constraint) {
    return [
      new PointerActivationConstraints.Distance({
        value: constraint.distance,
        tolerance: constraint.tolerance,
      }),
    ];
  }

  return [
    new PointerActivationConstraints.Delay({
      value: constraint.delay,
      tolerance: constraint.tolerance,
    }),
  ];
}

function moveColumns<T>(columns: Columns<T>, event: DragEndEvent) {
  return move(columns, event) as Columns<T>;
}

function moveItemsInColumns<T>(columns: Columns<T>, event: DragOverEvent | DragEndEvent) {
  const itemsByColumn = getItemsByColumn(columns);
  const movedItemsByColumn = move(itemsByColumn, event) as Record<
    string,
    Columns<T>[number]["items"]
  >;

  if (movedItemsByColumn === itemsByColumn) {
    return columns;
  }

  let didChange = false;
  const nextColumns = columns.map((column) => {
    const movedItems = movedItemsByColumn[getColumnKey(column.id)] ?? column.items;

    if (movedItems === column.items) {
      return column;
    }

    didChange = true;

    return {
      ...column,
      items: movedItems,
    };
  });

  return didChange ? nextColumns : columns;
}

function getItemsByColumn<T>(columns: Columns<T>) {
  return Object.fromEntries(
    columns.map((column) => [getColumnKey(column.id), column.items]),
  ) as Record<string, Columns<T>[number]["items"]>;
}

function getColumnKey(id: UniqueIdentifier) {
  return String(id);
}

function getAdjacentItemIds<T>(
  items: Columns<T>[number]["items"],
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
): Pick<ColumnMoveState, "previousColumnId" | "nextColumnId"> {
  return {
    previousColumnId: columns[index - 1]?.id ?? null,
    nextColumnId: columns[index + 1]?.id ?? null,
  };
}

function getColor(id: UniqueIdentifier) {
  switch (String(id)[0]) {
    case "A":
      return "#7193f1";
    case "B":
      return "#ffda6c";
    case "C":
      return "#00bcd4";
    case "D":
      return "#ef769f";
  }

  return undefined;
}

function Trash({ id }: { id: UniqueIdentifier }) {
  const { isDropTarget, ref } = useDroppable({
    id,
    accept: ITEM_TYPE,
    collisionPriority: CollisionPriority.Highest,
  });

  return (
    <div
      ref={ref}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "fixed",
        left: "50%",
        marginLeft: -150,
        bottom: 20,
        width: 300,
        height: 60,
        borderRadius: 5,
        border: "1px solid",
        borderColor: isDropTarget ? "red" : "#DDD",
      }}
    >
      Drop here to delete
    </div>
  );
}

interface SortableItemProps<ExtendedItem> {
  containerId: UniqueIdentifier;
  id: UniqueIdentifier;
  index: number;
  handle: boolean;
  content: string;
  item: Item<ExtendedItem>;
  isSorting: boolean;
  disabled?: boolean;
  style(args: ItemStyleArgs): React.CSSProperties;
  getIndex(id: UniqueIdentifier): number;
  renderItem: Props<ExtendedItem>["renderItem"];
  onItemClick?(): void;
  wrapperStyle({ index }: { index: number }): React.CSSProperties;
}

function SortableItem<T>({
  disabled,
  id,
  index,
  handle,
  renderItem,
  style,
  containerId,
  getIndex,
  wrapperStyle,
  content,
  onItemClick,
  item,
  isSorting,
}: SortableItemProps<T>) {
  const { handleRef, isDragSource, isDragging, ref } = useSortable({
    id,
    index,
    group: containerId,
    type: ITEM_TYPE,
    accept: ITEM_TYPE,
    disabled,
  });
  const mounted = useMountStatus();
  const mountedWhileDragging = isDragging && !mounted;

  return (
    <Item
      ref={ref}
      value={id}
      content={content}
      item={item}
      dragging={isDragging}
      sorting={isSorting}
      handle={handle}
      handleProps={handle ? { ref: handleRef } : undefined}
      index={index}
      wrapperStyle={wrapperStyle({ index })}
      style={style({
        index,
        value: id,
        isDragging,
        isSorting,
        overIndex: isDragSource ? getIndex(id) : -1,
        containerId,
        isDragOverlay: false,
      })}
      color={getColor(id)}
      transition={undefined}
      transform={null}
      fadeIn={mountedWhileDragging}
      listeners={handle ? { ref: handleRef } : {}}
      renderItem={renderItem as ItemProps["renderItem"]}
      onItemClick={onItemClick}
    />
  );
}

function useMountStatus() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setIsMounted(true), 500);

    return () => clearTimeout(timeout);
  }, []);

  return isMounted;
}
