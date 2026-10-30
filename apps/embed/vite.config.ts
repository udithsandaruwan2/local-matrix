import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

// Port 4173 avoids clashing with apps/web (5173) and the vite preview default.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 4173,
  },
  build: {
    target: "es2022",
  },
});
