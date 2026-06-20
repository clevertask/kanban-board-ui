/* eslint-disable react-refresh/only-export-components */

import { StrictMode, useCallback, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  type Columns,
  KanbanBoard,
  type MovedItemState,
  type TOnAddColumnArgs,
} from "../components/KanbanBoard";
import {
  removeColumnItem,
  moveColumnAfter,
  moveColumnBefore,
  moveItemAfter,
  moveItemBefore,
  moveItemToColumn,
  updateColumnItems,
  type ColumnMoveState,
} from "../utils/item-state-mutations";
import type { UniqueIdentifier } from "@dnd-kit/core";

type PreviewItemFields = { metadata?: { foo: string } };
type PreviewColumns = Columns<PreviewItemFields>;
type ItemRemoveResult = {
  itemId: UniqueIdentifier;
  fromContainer: UniqueIdentifier;
};
type LastEvent =
  | { type: "addItem"; result: { itemId: UniqueIdentifier; targetColumnId: UniqueIdentifier } }
  | { type: "addColumn"; result: TOnAddColumnArgs }
  | { type: "itemMove"; result: MovedItemState }
  | { type: "columnMove"; result: ColumnMoveState }
  | { type: "itemRemove"; result: ItemRemoveResult }
  | { type: "programmaticMove"; label: string; result: unknown };

function createBaseColumns(): PreviewColumns {
  return [
    {
      id: "todo",
      name: "To Do",
      items: [
        { id: "task-1", name: "Write API contract", metadata: { foo: "A" } },
        { id: "task-2", name: "Create mobile modal", metadata: { foo: "B" } },
      ],
      metadata: { columnId: 1 },
    },
    {
      id: "in-progress",
      name: "In Progress",
      items: [
        { id: "task-3", name: "Implement helpers", metadata: { foo: "C" } },
        { id: "task-4", name: "Connect UI buttons", metadata: { foo: "D" } },
      ],
      metadata: { columnId: 2 },
    },
    {
      id: "qa",
      name: "QA",
      items: [],
      metadata: { columnId: 3 },
    },
    {
      id: "done",
      name: "Done",
      items: [{ id: "task-5", name: "Ship docs", metadata: { foo: "E" } }],
      metadata: { columnId: 4 },
    },
  ];
}

function App() {
  const [columns, setColumns] = useState<PreviewColumns>(() => createBaseColumns());
  const [lastEvent, setLastEvent] = useState<LastEvent | null>(null);
  const [nextAddedItemNumber, setNextAddedItemNumber] = useState(1);
  const [nextAddedColumnNumber, setNextAddedColumnNumber] = useState(1);

  const resetBoard = useCallback(() => {
    setColumns(createBaseColumns());
    setLastEvent(null);
    setNextAddedItemNumber(1);
    setNextAddedColumnNumber(1);
  }, []);

  const addNewItemToColumn = useCallback(() => {
    const itemNumber = nextAddedItemNumber;
    const itemId = `task-added-${itemNumber}`;

    setNextAddedItemNumber(itemNumber + 1);
    setLastEvent({
      type: "addItem",
      result: { itemId, targetColumnId: "todo" },
    });
    setColumns((currentColumns) =>
      updateColumnItems(currentColumns, "todo", (currentItems) => [
        ...currentItems,
        {
          id: itemId,
          name: `Added externally ${itemNumber}`,
          metadata: { foo: "NEW" },
        },
      ]),
    );
  }, [nextAddedItemNumber]);

  const handleOnAddColumn = (data: TOnAddColumnArgs) => {
    const columnNumber = nextAddedColumnNumber;
    const nextColumn = {
      id: `added-column-${columnNumber}`,
      name: `Added Column ${columnNumber}`,
      metadata: { columnId: 1000 + columnNumber },
    };

    setNextAddedColumnNumber(columnNumber + 1);
    setLastEvent({ type: "addColumn", result: data });

    if (data?.item) {
      const movedItem = data.item as PreviewColumns[number]["items"][number];
      const fromContainer = data.fromContainer;

      setColumns((currentColumns) => {
        const updatedItems = removeColumnItem(currentColumns, fromContainer, movedItem.id);

        return [
          ...updatedItems,
          {
            ...nextColumn,
            items: [movedItem],
          },
        ];
      });
    } else {
      setColumns((currentColumns) => [
        ...currentColumns,
        {
          ...nextColumn,
          items: [],
        },
      ]);
    }
  };

  const handleItemRemoval = (result: ItemRemoveResult) => {
    setLastEvent({ type: "itemRemove", result });
    setColumns((currentColumns) =>
      removeColumnItem(currentColumns, result.fromContainer, result.itemId),
    );
  };

  const runProgrammaticMove = useCallback(
    (
      label: string,
      moveFn: (currentColumns: PreviewColumns) => {
        columns: PreviewColumns;
        result: unknown;
      },
    ) => {
      setColumns((currentColumns) => {
        const { columns: nextColumns, result } = moveFn(currentColumns);

        setLastEvent({ type: "programmaticMove", label, result });
        return nextColumns;
      });
    },
    [],
  );

  const moveTask4BeforeTask2 = useCallback(() => {
    runProgrammaticMove("moveItemBefore(task-4, task-2)", (currentColumns) =>
      moveItemBefore(currentColumns, "task-4", "task-2"),
    );
  }, [runProgrammaticMove]);

  const moveTask1AfterTask5 = useCallback(() => {
    runProgrammaticMove("moveItemAfter(task-1, task-5)", (currentColumns) =>
      moveItemAfter(currentColumns, "task-1", "task-5"),
    );
  }, [runProgrammaticMove]);

  const moveTask2ToQaTop = useCallback(() => {
    runProgrammaticMove("moveItemToColumn(task-2, qa, 0)", (currentColumns) =>
      moveItemToColumn(currentColumns, "task-2", "qa", 0),
    );
  }, [runProgrammaticMove]);

  const moveDoneBeforeTodo = useCallback(() => {
    runProgrammaticMove("moveColumnBefore(done, todo)", (currentColumns) =>
      moveColumnBefore(currentColumns, "done", "todo"),
    );
  }, [runProgrammaticMove]);

  const moveTodoAfterInProgress = useCallback(() => {
    runProgrammaticMove("moveColumnAfter(todo, in-progress)", (currentColumns) =>
      moveColumnAfter(currentColumns, "todo", "in-progress"),
    );
  }, [runProgrammaticMove]);

  const createBlockedAndMoveTask3 = useCallback(() => {
    runProgrammaticMove('Create "Blocked" + move task-3', (currentColumns) => {
      const blockedColumnId = "blocked";
      const hasBlockedColumn = currentColumns.some((column) => column.id === blockedColumnId);
      const withBlockedColumn = hasBlockedColumn
        ? currentColumns
        : [
            ...currentColumns,
            {
              id: blockedColumnId,
              name: "Blocked",
              items: [],
              metadata: { columnId: 999 },
            },
          ];

      return moveItemToColumn(withBlockedColumn, "task-3", blockedColumnId);
    });
  }, [runProgrammaticMove]);

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <KanbanBoard
        columns={columns}
        setColumns={setColumns}
        onColumnEdit={console.log}
        onItemMove={(result) => setLastEvent({ type: "itemMove", result })}
        onColumnMove={(result) => setLastEvent({ type: "columnMove", result })}
        onAddColumn={handleOnAddColumn}
        onItemClick={console.log}
        trashable
        onItemRemove={handleItemRemoval}
        renderColumn={(props) => {
          const label = props.label ?? String(props.id);

          if (props.isColumnPlaceholder) {
            return (
              <section
                ref={props.ref}
                aria-label="Kanban add column placeholder"
                data-kanban-add-column-placeholder
                style={{
                  alignItems: "center",
                  border: "1px dashed #888",
                  boxSizing: "border-box",
                  display: "flex",
                  justifyContent: "center",
                  minHeight: "10rem",
                  padding: "1rem",
                  width: "14rem",
                  ...props.style,
                }}
              >
                {props.children}
              </section>
            );
          }

          return (
            <section
              ref={props.ref}
              aria-label={`Kanban column ${label}`}
              data-kanban-column
              data-kanban-column-id={String(props.id)}
              style={{
                boxSizing: "border-box",
                display: "grid",
                gap: "0.75rem",
                padding: "1rem",
                width: "22rem",
                outline: "1px solid red",
                ...props.style,
              }}
            >
              <button
                type="button"
                {...props.attributes}
                {...props.dragListeners}
                aria-label={`Drag column ${label}`}
                data-kanban-column-drag-handle
                style={{ cursor: "grab", justifySelf: "start" }}
              >
                Drag column
              </button>
              <h3 data-kanban-column-label style={{ margin: 0 }}>
                {label}
              </h3>
              <p style={{ margin: 0 }}>{props.columnMetadata?.columnId}</p>
              <ul
                aria-label={`Items in ${label}`}
                style={{
                  display: "grid",
                  gap: "1rem",
                  listStyle: "none",
                  margin: 0,
                  minHeight: "4rem",
                  padding: 0,
                }}
              >
                {props.children}
              </ul>
            </section>
          );
        }}
        renderItem={({
          item,
          dragging,
          dragOverlay,
          onItemClick,
          dragListeners,
          ref,
          styleLayout,
        }) => {
          const label = item.name ?? String(item.id);

          return (
            <li
              ref={ref}
              aria-label={dragOverlay ? undefined : `Kanban item ${label}`}
              data-kanban-item
              data-kanban-item-id={String(item.id)}
              onClick={onItemClick}
              style={{
                backgroundColor: dragging ? "#f0f0f0" : "#fff",
                border: "1px solid #ccc",
                borderRadius: "8px",
                display: "grid",
                gap: "0.5rem",
                margin: 0,
                padding: "16px",
                ...styleLayout,
              }}
            >
              <strong data-kanban-item-label>{label}</strong>
              <span>{item.metadata?.foo}</span>
              <button type="button">Click item</button>

              <button
                type="button"
                {...dragListeners}
                aria-label={dragOverlay ? undefined : `Drag item ${label}`}
                data-kanban-item-drag-handle
                style={{ cursor: "grab", justifySelf: "start" }}
              >
                Drag item
              </button>
            </li>
          );
        }}
      />
      <div
        style={{
          display: "grid",
          gap: "0.5rem",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          padding: "0 20px",
        }}
      >
        <button onClick={addNewItemToColumn}>Add item to To Do</button>
        <button onClick={moveTask4BeforeTask2}>moveItemBefore(task-4, task-2)</button>
        <button onClick={moveTask1AfterTask5}>moveItemAfter(task-1, task-5)</button>
        <button onClick={moveTask2ToQaTop}>moveItemToColumn(task-2, qa, 0)</button>
        <button onClick={moveDoneBeforeTodo}>moveColumnBefore(done, todo)</button>
        <button onClick={moveTodoAfterInProgress}>moveColumnAfter(todo, in-progress)</button>
        <button onClick={createBlockedAndMoveTask3}>Create "Blocked" + move task-3</button>
        <button onClick={resetBoard}>Reset board</button>
      </div>
      <pre
        aria-label="Last kanban event"
        data-kanban-last-event
        style={{ margin: "0 20px 20px", padding: 12, border: "1px solid #ddd" }}
      >
        {lastEvent
          ? JSON.stringify(lastEvent, null, 2)
          : "Move result will appear here (programmatic or drag-and-drop)."}
      </pre>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
