import { StrictMode, useCallback, useState } from "react";
import { createRoot } from "react-dom/client";
import { Items, KanbanBoard } from "../components/KanbanBoard";
import { updateColumnItems } from "../utils/item-state-mutations";

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

  console.log(items);

  return (
    <>
      <KanbanBoard
        items={items}
        setItems={setItems}
        onItemMove={(v) => console.log(v)}
        onColumnMove={(v) => console.log(v)}
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
