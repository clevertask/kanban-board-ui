import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "e2e/utils/index.ts"),
      formats: ["es"],
      fileName: "index",
    },
    rollupOptions: {
      external: ["@playwright/test"],
    },
    outDir: "dist/e2e",
    emptyOutDir: false,
  },
});
