import { StrictMode, useCallback, useState } from "react";
import { createRoot } from "react-dom/client";
import { Items, KanbanBoard, TOnAddColumnArgs } from "../components/KanbanBoard";
import { removeColumnItem, updateColumnItems } from "../utils/item-state-mutations";
import { UniqueIdentifier } from "@dnd-kit/core";

function App() {
  const [items, setItems] = useState<Items>([
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
    const updateItems = updateColumnItems(items, "1", (ci) => [
      ...ci,
      { id: Math.random().toString(), name: Math.random().toString() },
    ]);
    setItems(updateItems);
  }, [items]);

  const handleOnAddColumn = (data: TOnAddColumnArgs) => {
    if (data && data.item) {
      const updatedItems = removeColumnItem(items, data.fromContainer, data.item.id);
      setItems(() => [
        ...updatedItems,
        { id: Math.random().toString(), name: Math.random().toString(), items: [data.item!] },
      ]);
    } else {
      setItems((ci) => [...ci, { id: Math.random().toString(), name: Math.random().toString(), items: [] }]);
    }
  };

  const handleItemRemoval = (result: { itemId: UniqueIdentifier; fromContainer: UniqueIdentifier }) => {
    const updatedItems = removeColumnItem(items, result.fromContainer, result.itemId);
    setItems(updatedItems);
  };

  return (
    <>
      <KanbanBoard
        items={items}
        setItems={setItems}
        onColumnEdit={console.log}
        onItemMove={(v) => console.log(v)}
        onColumnMove={(v) => console.log(v)}
        onAddColumn={handleOnAddColumn}
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
