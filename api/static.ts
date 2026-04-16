import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Define __dirname for ESM (ECMAScript Modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");

  if (!fs.existsSync(distPath)) {
    console.error(`Build directory missing: ${distPath}`);
  }

  /**
   * Serve static files (CSS, JS, Images).
   * { index: false } tells Express NOT to automatically serve index.html 
   * when a user hits the root path, letting our wildcard handler below 
   * handle it instead. This prevents "double-serving" issues.
   */
  app.use(express.static(distPath, { index: false }));

  /**
   * The SPA Catch-all:
   * (.*) ensures that any request not caught by an API route or 
   * a physical static file gets sent to index.html.
   */
  app.get("(.*)", (_req, res) => {
    const indexPath = path.resolve(distPath, "index.html");
    
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send("Frontend build not found.");
    }
  });
}