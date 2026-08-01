import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ["@clevertask/kanban-board-ui"],
  },
  resolve: {
    dedupe: ["react", "react-dom"],
  },
});
