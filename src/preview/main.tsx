import { StrictMode, useCallback, useState } from "react";
import { createRoot } from "react-dom/client";
import { Columns, KanbanBoard, TOnAddColumnArgs } from "../components/KanbanBoard";
import {
  removeColumnItem,
  moveColumnAfter,
  moveColumnBefore,
  moveItemAfter,
  moveItemBefore,
  moveItemToColumn,
  updateColumnItems,
} from "../utils/item-state-mutations";
import { UniqueIdentifier } from "@dnd-kit/core";

function App() {
  const [columns, setColumns] = useState<Columns<{ metadata?: { foo: string } }>>([
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
  ]);

  const addNewItemToColumn = useCallback(() => {
    setColumns((currentColumns) =>
      updateColumnItems(currentColumns, "todo", (currentItems) => [
        ...currentItems,
        {
          id: `task-${Math.random().toString(36).slice(2, 8)}`,
          name: "Added externally",
          metadata: { foo: "NEW" },
        },
      ]),
    );
  }, []);

  const handleOnAddColumn = (data: TOnAddColumnArgs) => {
    console.log(data);
    if (data && data.item) {
      setColumns((currentColumns) => {
        const updatedItems = removeColumnItem(currentColumns, data.fromContainer, data.item.id);
        return [
          ...updatedItems,
          {
            id: Math.random().toString(),
            name: Math.random().toString(),
            items: [data.item],
          },
        ];
      });
    } else {
      setColumns((ci) => [
        ...ci,
        {
          id: Math.random().toString(),
          name: Math.random().toString(),
          items: [],
        },
      ]);
    }
  };

  const handleItemRemoval = (result: {
    itemId: UniqueIdentifier;
    fromContainer: UniqueIdentifier;
  }) => {
    setColumns((currentColumns) =>
      removeColumnItem(currentColumns, result.fromContainer, result.itemId),
    );
  };

  const moveTask4BeforeTask2 = useCallback(() => {
    setColumns((currentColumns) => {
      const { columns: nextColumns, result } = moveItemBefore(currentColumns, "task-4", "task-2");
      console.log("moveItemBefore result", result);
      return nextColumns;
    });
  }, []);

  const moveTask1AfterTask5 = useCallback(() => {
    setColumns((currentColumns) => {
      const { columns: nextColumns, result } = moveItemAfter(currentColumns, "task-1", "task-5");
      console.log("moveItemAfter result", result);
      return nextColumns;
    });
  }, []);

  const moveTask2ToQaTop = useCallback(() => {
    setColumns((currentColumns) => {
      const { columns: nextColumns, result } = moveItemToColumn(currentColumns, "task-2", "qa", 0);
      console.log("moveItemToColumn result", result);
      return nextColumns;
    });
  }, []);

  const moveDoneBeforeTodo = useCallback(() => {
    setColumns((currentColumns) => {
      const { columns: nextColumns, result } = moveColumnBefore(currentColumns, "done", "todo");
      console.log("moveColumnBefore result", result);
      return nextColumns;
    });
  }, []);

  const moveTodoAfterInProgress = useCallback(() => {
    setColumns((currentColumns) => {
      const { columns: nextColumns, result } = moveColumnAfter(
        currentColumns,
        "todo",
        "in-progress",
      );
      console.log("moveColumnAfter result", result);
      return nextColumns;
    });
  }, []);

  const createBlockedAndMoveTask3 = useCallback(() => {
    setColumns((currentColumns) => {
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

      const { columns: nextColumns, result } = moveItemToColumn(
        withBlockedColumn,
        "task-3",
        blockedColumnId,
      );
      console.log("createBlockedAndMoveTask3 result", result);
      return nextColumns;
    });
  }, []);

  return (
    <>
      <KanbanBoard
        columns={columns}
        setColumns={setColumns}
        onColumnEdit={console.log}
        onItemMove={(v) => console.log(v)}
        onColumnMove={(v) => console.log(v)}
        onAddColumn={handleOnAddColumn}
        onItemClick={console.log}
        trashable
        onItemRemove={handleItemRemoval}
        renderColumn={(props) => {
          return (
            <div
              ref={props.ref}
              style={{
                padding: "1rem",
                width: "22rem",
                outline: "1px solid red",
                ...props.style,
              }}
            >
              <button {...props.dragListeners}>Drag meeeasdee!</button>
              <h3>{props.label}</h3>
              <h3>{props.columnMetadata?.columnId}</h3>
              {props.children}
            </div>
          );
        }}
        renderItem={({ item, dragging, onItemClick, dragListeners, ref, styleLayout }) => {
          return (
            <li
              ref={ref}
              onClick={onItemClick}
              style={{
                padding: "16px",
                marginTop: "1rem",
                backgroundColor: dragging ? "#f0f0f0" : "#fff",
                border: "1px solid #ccc",
                borderRadius: "24px",
                ...styleLayout,
              }}
            >
              <strong>
                {item.name} {item.metadata?.foo}
              </strong>
              <button>Click me</button>

              <div {...dragListeners} style={{ cursor: "pointer" }}>
                Drag from here
              </div>
            </li>
          );
        }}
      />
      <div
        style={{
          display: "grid",
          gap: "0.5rem",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          padding: "0 20px 20px",
        }}
      >
        <button onClick={addNewItemToColumn}>Add item to To Do</button>
        <button onClick={moveTask4BeforeTask2}>moveItemBefore(task-4, task-2)</button>
        <button onClick={moveTask1AfterTask5}>moveItemAfter(task-1, task-5)</button>
        <button onClick={moveTask2ToQaTop}>moveItemToColumn(task-2, qa, 0)</button>
        <button onClick={moveDoneBeforeTodo}>moveColumnBefore(done, todo)</button>
        <button onClick={moveTodoAfterInProgress}>moveColumnAfter(todo, in-progress)</button>
        <button onClick={createBlockedAndMoveTask3}>Create "Blocked" + move task-3</button>
      </div>
    </>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
