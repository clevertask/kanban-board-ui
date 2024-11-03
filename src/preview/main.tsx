import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { KanbanBoard } from "../components/KanbanBoard";

function App() {
  return <KanbanBoard handle onItemMove={(v) => console.log(v)} trashable />;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
