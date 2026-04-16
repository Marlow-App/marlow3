import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Use absolute paths starting from the project root
      "@": path.resolve(process.cwd(), "client/src"),
      "@shared": path.resolve(process.cwd(), "shared"),
    },
  },
  // Tells Vite that the frontend code is in the /client folder
  root: path.resolve(process.cwd(), "client"),
  build: {
    // Tells Vite to put the finished site in /dist at the project root
    outDir: path.resolve(process.cwd(), "dist"),
    emptyOutDir: true,
  },
});