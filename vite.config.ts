import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "client/src"),
      "@shared": path.resolve(process.cwd(), "shared"),
    },
  },
  root: path.resolve(process.cwd(), "client"),
  build: {
    // This ensures the build goes to /dist at the project root
    outDir: path.resolve(process.cwd(), "dist"),
    emptyOutDir: true,
  },
});