import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// FIXED: Define __dirname for ESM (ECMAScript Modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function serveStatic(app: Express) {
  // On Vercel, the 'public' folder is usually in the same directory as static.js 
  // after the build process finishes.
  const distPath = path.resolve(__dirname, "public");

  if (!fs.existsSync(distPath)) {
    // Logging instead of throwing helps debug Vercel deployments without crashing the process immediately
    console.error(`Build directory missing: ${distPath}`);
  }

  app.use(express.static(distPath));

  // FIXED: Standard Express wildcard for SPA (Single Page Application) routing
  app.get("*", (_req, res) => {
    const indexPath = path.resolve(distPath, "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send("Frontend build not found. Ensure 'npm run build' was executed.");
    }
  });
}