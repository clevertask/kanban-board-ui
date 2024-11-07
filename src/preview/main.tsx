import { StrictMode, useCallback, useState } from "react";
import { createRoot } from "react-dom/client";
import { Columns, KanbanBoard, TOnAddColumnArgs } from "../components/KanbanBoard";
import { removeColumnItem, updateColumnItems } from "../utils/item-state-mutations";
import { UniqueIdentifier } from "@dnd-kit/core";

function App() {
  const [columns, setColumns] = useState<Columns>([
    {
      id: "1",
      name: "A",
      items: [{ id: "12", name: "A2" }],
    },
    {
      id: "21",
      name: "A2212",
      items: [{ id: "12asdasda", name: "asA2" }],
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
