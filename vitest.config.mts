import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dirname = path.dirname(fileURLToPath(import.meta.url));

// Solo per la logica pura di src/lib (date, quantità, ecc.): niente
// database, niente rendering React, niente ambiente browser — quei
// livelli restano coperti a mano come per il resto dell'app finora.
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
