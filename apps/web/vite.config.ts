/// <reference types="vitest/config" />
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

// Console dev server proxies the API; auth cookie stays same-origin in dev.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      "/v1": "http://localhost:3001",
      "/health": "http://localhost:3001",
    },
  },
  build: {
    sourcemap: false,
    target: "es2022",
  },
  test: {
    environment: "node",
  },
});
