import { StrictMode, useCallback, useState } from "react";
import { createRoot } from "react-dom/client";
import { Columns, KanbanBoard, TOnAddColumnArgs } from "../components/KanbanBoard";
import { removeColumnItem, updateColumnItems } from "../utils/item-state-mutations";
import { UniqueIdentifier } from "@dnd-kit/core";

function App() {
  const [columns, setColumns] = useState<Columns<{ metadata?: { foo: string } }>>([
    {
      id: "1",
      name: "A",
      items: [{ id: "12", name: "A2" }],
    },
    {
      id: "21",
      name: "A2212",
      items: [{ id: "12asdasda", name: "asA2", metadata: { foo: "2" } }],
    },
  ]);

  const addNewItemToColumn = useCallback(() => {
    const updateItems = updateColumnItems(columns, "1", (ci) => [
      ...ci,
      { id: Math.random().toString(), name: Math.random().toString() },
    ]);
    setColumns(updateItems);
  }, [columns]);

  const handleOnAddColumn = (data: TOnAddColumnArgs) => {
    if (data && data.item) {
      const updatedItems = removeColumnItem(columns, data.fromContainer, data.item.id);
      setColumns(() => [
        ...updatedItems,
        { id: Math.random().toString(), name: Math.random().toString(), items: [data.item!] },
      ]);
    } else {
      setColumns((ci) => [...ci, { id: Math.random().toString(), name: Math.random().toString(), items: [] }]);
    }
  };

  const handleItemRemoval = (result: { itemId: UniqueIdentifier; fromContainer: UniqueIdentifier }) => {
    const updatedItems = removeColumnItem(columns, result.fromContainer, result.itemId);
    setColumns(updatedItems);
  };

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
            <div ref={props.ref} style={{ padding: "1rem", width: "22rem", outline: "1px solid red", ...props.style }}>
              <button {...props.dragListeners}>Drag meeeee!</button>
              <h3>{props.label}</h3>
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
      <button onClick={addNewItemToColumn}>Add item to column externally</button>
    </>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
