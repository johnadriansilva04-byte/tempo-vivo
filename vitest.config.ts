import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Config dedicada de testes: ambiente node, alias @ -> src.
// Mantida separada de vite.config.ts para não carregar os plugins de app/SSR.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    globals: true,
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
