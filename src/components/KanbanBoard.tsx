import React, { Dispatch, SetStateAction, useCallback, useEffect, useRef, useState } from "react";
import { createPortal, unstable_batchedUpdates } from "react-dom";
import {
  CancelDrop,
  closestCenter,
  pointerWithin,
  rectIntersection,
  CollisionDetection,
  DndContext,
  DragOverlay,
  DropAnimation,
  getFirstCollision,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  Modifiers,
  useDroppable,
  UniqueIdentifier,
  useSensors,
  useSensor,
  MeasuringStrategy,
  KeyboardCoordinateGetter,
  defaultDropAnimationSideEffects,
} from "@dnd-kit/core";
import {
  AnimateLayoutChanges,
  SortableContext,
  useSortable,
  arrayMove,
  defaultAnimateLayoutChanges,
  verticalListSortingStrategy,
  SortingStrategy,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { coordinateGetter as multipleContainersCoordinateGetter } from "../utils/multipleContainerKeyboardCoordinates";
import { Item } from "./Item";
import { Container, ContainerProps } from "./Container";

const animateLayoutChanges: AnimateLayoutChanges = (args) =>
  defaultAnimateLayoutChanges({ ...args, wasDragging: true });

function DroppableContainer({
  children,
  columns = 1,
  disabled,
  id,
  items,
  style,
  ...props
}: ContainerProps & {
  disabled?: boolean;
  id: UniqueIdentifier;
  items: UniqueIdentifier[];
  style?: React.CSSProperties;
}) {
  const { active, attributes, isDragging, listeners, over, setNodeRef, transition, transform } = useSortable({
    id,
    data: {
      type: "container",
      children: items,
    },
    animateLayoutChanges,
  });
  const isOverContainer = over
    ? (id === over.id && active?.data.current?.type !== "container") || items.includes(over.id)
    : false;

  return (
    <Container
      ref={disabled ? undefined : setNodeRef}
      style={{
        ...style,
        transition,
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.5 : undefined,
      }}
      hover={isOverContainer}
      handleProps={{
        ...attributes,
        ...listeners,
      }}
      columns={columns}
      {...props}
    >
      {children}
    </Container>
  );
}

const dropAnimation: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: "0.5",
      },
    },
  }),
};

export type DataItem = { id: string; name: string };
export type Items = { id: string; name: string; items: DataItem[] }[];

interface MovedItemState {
  itemId: UniqueIdentifier;
  newIndex: number;
  sourceColumnId: UniqueIdentifier;
  targetColumnId: UniqueIdentifier;
  hasEnded: boolean;
}

interface Props {
  adjustScale?: boolean;
  cancelDrop?: CancelDrop;
  columns?: number;
  containerStyle?: React.CSSProperties;
  coordinateGetter?: KeyboardCoordinateGetter;
  getItemStyles?(args: {
    value: UniqueIdentifier;
    index: number;
    overIndex: number;
    isDragging: boolean;
    containerId: UniqueIdentifier;
    isSorting: boolean;
    isDragOverlay: boolean;
  }): React.CSSProperties;
  wrapperStyle?(args: { index: number }): React.CSSProperties;
  onItemMove(result: MovedItemState): void;
  onColumnMove?(result: { newIndex: number; columnId: UniqueIdentifier }): void;
  itemCount?: number;
  items: Items;
  setItems: Dispatch<SetStateAction<Items>>;
  handle?: boolean;
  renderItem?: any;
  strategy?: SortingStrategy;
  modifiers?: Modifiers;
  minimal?: boolean;
  trashable?: boolean;
  scrollable?: boolean;
  vertical?: boolean;
}

export const TRASH_ID = "void";
const PLACEHOLDER_ID = "placeholder";
const empty: UniqueIdentifier[] = [];

export function KanbanBoard({
  items,
  setItems,
  adjustScale = false,
  cancelDrop,
  columns,
  handle = true,
  containerStyle,
  coordinateGetter = multipleContainersCoordinateGetter,
  getItemStyles = () => ({}),
  wrapperStyle = () => ({}),
  minimal = false,
  modifiers,
  renderItem,
  strategy = verticalListSortingStrategy,
  trashable = false,
  vertical = false,
  scrollable,
  onItemMove,
  onColumnMove,
}: Props) {
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [movedItemState, setMovedItemState] = useState<MovedItemState | null>(null);

  const recentlyMovedToNewContainer = useRef(false);
  const lastOverId = useRef<UniqueIdentifier | null>(null);
  const isSortingContainer = activeId ? items.some(({ id }) => id === activeId) : false;

  /**
   * Custom collision detection strategy optimized for multiple containers
   *
   * - First, find any droppable containers intersecting with the pointer.
   * - If there are none, find intersecting containers with the active draggable.
   * - If there are no intersecting containers, return the last matched intersection
   *
   */
  const collisionDetectionStrategy: CollisionDetection = useCallback(
    (args) => {
      if (activeId && items.some(({ id }) => activeId === id)) {
        return closestCenter({
          ...args,
          droppableContainers: args.droppableContainers.filter((container) =>
            items.some(({ id }) => id === container.id)
          ),
        });
      }

      // Start by finding any intersecting droppable
      const pointerIntersections = pointerWithin(args);
      const intersections =
        pointerIntersections.length > 0
          ? // If there are droppables intersecting with the pointer, return those
            pointerIntersections
          : rectIntersection(args);
      let overId = getFirstCollision(intersections, "id");

      if (overId != null) {
        if (overId === TRASH_ID) {
          // If the intersecting droppable is the trash, return early
          // Remove this if you're not using trashable functionality in your app
          return intersections;
        }

        if (items.some(({ id }) => id === overId)) {
          const containerItems = items.find(({ id }) => id === overId)?.items;

          // If a container is matched and it contains items (columns 'A', 'B', 'C')
          if (containerItems && containerItems.length > 0) {
            // Return the closest droppable within that container
            overId = closestCenter({
              ...args,
              droppableContainers: args.droppableContainers.filter(
                (container) => container.id !== overId && containerItems.some(({ id }) => id === container.id)
              ),
            })[0]?.id;
          }
        }

        lastOverId.current = overId;
        return [{ id: overId }];
      }

      // When a draggable item moves to a new container, the layout may shift
      // and the `overId` may become `null`. We manually set the cached `lastOverId`
      // to the id of the draggable item that was moved to the new container, otherwise
      // the previous `overId` will be returned which can cause items to incorrectly shift positions
      if (recentlyMovedToNewContainer.current) {
        lastOverId.current = activeId;
      }

      // If no droppable is matched, return the last match
      return lastOverId.current ? [{ id: lastOverId.current }] : [];
    },
    [activeId, items]
  );
  const [clonedItems, setClonedItems] = useState<Items | null>(null);
  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter,
    })
  );
  const findContainer = (id: UniqueIdentifier) => {
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

  const getIndex = (id: UniqueIdentifier) => {
    const containerId = findContainer(id);
    if (!containerId) return -1;

    const column = items.find((col) => col.id === containerId);
    return column ? column.items.findIndex((item) => item.id === id) : -1;
  };

  const onDragCancel = () => {
    if (clonedItems) {
      // Reset items to their original state in case items have been
      // Dragged across containers
      setItems(clonedItems);
    }

    setActiveId(null);
    setClonedItems(null);
  };

  useEffect(() => {
    requestAnimationFrame(() => {
      recentlyMovedToNewContainer.current = false;
    });
  }, [items]);

  useEffect(() => {
    if (movedItemState && movedItemState.hasEnded) {
      onItemMove(movedItemState);
    }
  }, [movedItemState, onItemMove]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetectionStrategy}
      measuring={{
        droppable: {
          strategy: MeasuringStrategy.Always,
        },
      }}
      onDragStart={({ active }) => {
        setActiveId(active.id);
        setClonedItems(items);
        const activeContainer = findContainer(active.id);
        if (activeContainer) {
          setMovedItemState({
            itemId: "",
            targetColumnId: "",
            newIndex: 0,
            sourceColumnId: activeContainer,
            hasEnded: false,
          });
        }
      }}
      onDragOver={({ active, over }) => {
        const overId = over?.id;
        if (overId == null || overId === TRASH_ID || items.some(({ id }) => active.id === id)) {
          return;
        }

        const overContainer = findContainer(overId);
        const activeContainer = findContainer(active.id);

        if (!overContainer || !activeContainer) {
          return;
        }

        if (activeContainer !== overContainer) {
          const activeColumn = items.find(({ id }) => id === activeContainer);
          const overColumn = items.find(({ id }) => id === overContainer);

          if (!activeColumn || !overColumn) {
            return;
          }

          const activeItems = activeColumn.items;
          const overItems = overColumn.items;

          const overIndex = overItems.findIndex(({ id }) => id === overId);
          const activeIndex = activeItems.findIndex(({ id }) => id === active.id);

          let newIndex: number;

          if (items.some((i) => i.id === overId)) {
            newIndex = overItems.length + 1;
          } else {
            const isBelowOverItem =
              over &&
              active.rect.current.translated &&
              active.rect.current.translated.top > over.rect.top + over.rect.height;

            const modifier = isBelowOverItem ? 1 : 0;

            newIndex = overIndex >= 0 ? overIndex + modifier : overItems.length + 1;
          }

          recentlyMovedToNewContainer.current = true;

          setMovedItemState(
            (cs) =>
              cs && {
                ...cs,
                itemId: active.id,
                targetColumnId: overContainer,
                newIndex,
              }
          );

          // Update the items array in an array-based structure
          setItems((prevItems) => {
            const updatedItems = prevItems.map((column) => {
              if (column.id === activeContainer) {
                return {
                  ...column,
                  items: column.items.filter((item) => item.id !== active.id),
                };
              } else if (column.id === overContainer) {
                const newItems = [...overItems];
                const [movedItem] = activeItems.splice(activeIndex, 1);
                newItems.splice(newIndex, 0, movedItem);
                return {
                  ...column,
                  items: newItems,
                };
              }
              return column;
            });
            return updatedItems;
          });
        }
      }}
      onDragEnd={({ active, over }) => {
        if (items.some((i) => i.id === active.id) && over?.id) {
          const activeIndex = items.map(({ id }) => id).indexOf(active.id);
          const overIndex = items.map(({ id }) => id).indexOf(over.id);

          onColumnMove?.({ newIndex: overIndex, columnId: active.id });
          setItems((containers) => arrayMove(containers, activeIndex, overIndex));
          return;
        }

        const activeContainer = findContainer(active.id);

        if (!activeContainer) {
          setActiveId(null);
          return;
        }

        const overId = over?.id;

        if (overId == null) {
          setActiveId(null);
          return;
        }

        if (overId === TRASH_ID) {
          setItems((prevItems) =>
            prevItems.map((column) => {
              if (column.id === activeContainer) {
                return {
                  ...column,
                  items: column.items.filter((item) => item.id !== activeId),
                };
              }
              return column;
            })
          );

          setActiveId(null);
          return;
        }

        if (overId === PLACEHOLDER_ID) {
          const newContainerId = getNextContainerId();

          // unstable_batchedUpdates(() => {
          //   setContainers((containers) => [...containers, newContainerId]);
          //   setItems((items) => ({
          //     ...items,
          //     [activeContainer]: items[activeContainer].filter((id) => id !== activeId),
          //     [newContainerId]: [active.id],
          //   }));
          //   setActiveId(null);
          // });
          return;
        }

        const overContainer = findContainer(overId);

        if (overContainer) {
          const activeIndex = items
            .find((i) => i.id === activeContainer)
            ?.items.map((i) => i.id)
            .indexOf(active.id);

          const overIndex = items
            .find((i) => i.id === overContainer)
            .items.map((i) => i.id)
            .indexOf(overId);

          if (activeIndex !== overIndex) {
            setMovedItemState(
              (cs) =>
                cs && {
                  ...cs,
                  itemId: active.id,
                  newIndex: overIndex,
                  targetColumnId: overContainer,
                  hasEnded: true,
                }
            );

            setItems((items) =>
              items.map((item) => {
                if (item.id === overContainer) {
                  return {
                    ...item,
                    items: arrayMove(items.find((i) => i.id === overContainer)?.items, activeIndex, overIndex),
                  };
                }
                return item;
              })
            );

            return;
          }

          // It applies when an item is moved from one column to another but, for
          // some reason, keeps the same index it had on the previous column:
          setMovedItemState(
            (cs) =>
              cs && {
                ...cs,
                hasEnded: true,
              }
          );
        }

        setActiveId(null);
      }}
      cancelDrop={cancelDrop}
      onDragCancel={onDragCancel}
      modifiers={modifiers}
    >
      <div
        style={{
          display: "inline-grid",
          boxSizing: "border-box",
          padding: 20,
          gridAutoFlow: vertical ? "row" : "column",
        }}
      >
        <SortableContext
          items={[...items, PLACEHOLDER_ID]}
          strategy={vertical ? verticalListSortingStrategy : horizontalListSortingStrategy}
        >
          {items.map(({ id: containerId, name, items }) => (
            <DroppableContainer
              key={containerId}
              id={containerId}
              label={name}
              columns={columns}
              items={items.map((i) => i.id)}
              scrollable={scrollable}
              style={containerStyle}
              unstyled={minimal}
              onRemove={() => handleRemove(containerId)}
            >
              <SortableContext items={items} strategy={strategy}>
                {items.map(({ id: value, name }, index) => {
                  return (
                    <SortableItem
                      disabled={isSortingContainer}
                      key={value}
                      id={value}
                      content={name}
                      index={index}
                      handle={handle}
                      style={getItemStyles}
                      wrapperStyle={wrapperStyle}
                      renderItem={renderItem}
                      containerId={containerId}
                      getIndex={getIndex}
                    />
                  );
                })}
              </SortableContext>
            </DroppableContainer>
          ))}
          {minimal ? undefined : (
            <DroppableContainer
              id={PLACEHOLDER_ID}
              disabled={isSortingContainer}
              items={empty}
              onClick={handleAddColumn}
              placeholder
            >
              + Add column
            </DroppableContainer>
          )}
        </SortableContext>
      </div>
      {createPortal(
        <DragOverlay adjustScale={adjustScale} dropAnimation={dropAnimation}>
          {activeId
            ? items.some((c) => c.id === activeId)
              ? renderContainerDragOverlay(activeId)
              : renderSortableItemDragOverlay(activeId)
            : null}
        </DragOverlay>,
        document.body
      )}
      {trashable && activeId && !items.some((c) => c.id === activeId) ? <Trash id={TRASH_ID} /> : null}
    </DndContext>
  );

  function renderSortableItemDragOverlay(id: UniqueIdentifier) {
    return (
      <Item
        value={id}
        handle={handle}
        content={items.find((i) => i.id === findContainer(id))?.items.find(({ id: _id }) => _id === id)?.name || ""}
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
        renderItem={renderItem}
        dragOverlay
      />
    );
  }

  function renderContainerDragOverlay(containerId: UniqueIdentifier) {
    return (
      <Container
        label={items.find((i) => i.id === containerId)?.name || ""}
        columns={columns}
        style={{
          height: "100%",
        }}
        shadow
        unstyled={false}
      >
        {items
          .find((i) => i.id === containerId)
          ?.items.map(({ id: item, name }, index) => (
            <Item
              key={item}
              value={item}
              content={name}
              handle={handle}
              style={getItemStyles({
                containerId,
                overIndex: -1,
                index: getIndex(item),
                value: item,
                isDragging: false,
                isSorting: false,
                isDragOverlay: false,
              })}
              color={getColor(item)}
              wrapperStyle={wrapperStyle({ index })}
              renderItem={renderItem}
            />
          ))}
      </Container>
    );
  }

  function handleRemove(containerID: UniqueIdentifier) {
    setContainers((containers) => containers.filter((id) => id !== containerID));
  }

  function handleAddColumn() {
    const newContainerId = getNextContainerId();

    unstable_batchedUpdates(() => {
      setContainers((containers) => [...containers, newContainerId]);
      setItems((items) => ({
        ...items,
        [newContainerId]: [],
      }));
    });
  }

  function getNextContainerId() {
    const containerIds = Object.keys(items);
    const lastContainerId = containerIds[containerIds.length - 1];

    return String.fromCharCode(lastContainerId.charCodeAt(0) + 1);
  }
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
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
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
        borderColor: isOver ? "red" : "#DDD",
      }}
    >
      Drop here to delete
    </div>
  );
}

interface SortableItemProps {
  containerId: UniqueIdentifier;
  id: UniqueIdentifier;
  index: number;
  handle: boolean;
  content: string;
  disabled?: boolean;
  style(args: any): React.CSSProperties;
  getIndex(id: UniqueIdentifier): number;
  renderItem(): React.ReactElement;
  wrapperStyle({ index }: { index: number }): React.CSSProperties;
}

function SortableItem({
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
}: SortableItemProps) {
  const { setNodeRef, setActivatorNodeRef, listeners, isDragging, isSorting, over, overIndex, transform, transition } =
    useSortable({
      id,
    });
  const mounted = useMountStatus();
  const mountedWhileDragging = isDragging && !mounted;

  return (
    <Item
      ref={disabled ? undefined : setNodeRef}
      value={id}
      content={content}
      dragging={isDragging}
      sorting={isSorting}
      handle={handle}
      handleProps={handle ? { ref: setActivatorNodeRef } : undefined}
      index={index}
      wrapperStyle={wrapperStyle({ index })}
      style={style({
        index,
        value: id,
        isDragging,
        isSorting,
        overIndex: over ? getIndex(over.id) : overIndex,
        containerId,
      })}
      color={getColor(id)}
      transition={transition}
      transform={transform}
      fadeIn={mountedWhileDragging}
      listeners={listeners}
      renderItem={renderItem}
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
