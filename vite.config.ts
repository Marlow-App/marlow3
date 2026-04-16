import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

// This ensures paths are calculated correctly regardless of the environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  resolve: {
  alias: {
    "@": path.resolve(__dirname, "./client/src"),
    "@shared": path.resolve(__dirname, "./shared"),
    // Point this to the actual folder at the root
    "@assets": path.resolve(__dirname, "./attached_assets"), 
  },
},
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: false,
    minify: "esbuild",
    reportCompressedSize: false,
    // This tells Vite to handle larger assets properly
    assetsInlineLimit: 0, 
  },
});
