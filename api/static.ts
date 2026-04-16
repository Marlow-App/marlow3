import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");

  if (!fs.existsSync(distPath)) {
    console.error(`Build directory missing: ${distPath}`);
  }

  app.use(express.static(distPath, { index: false }));

  // The '/:any*' syntax is the foolproof way to catch all routes 
  // in the newest versions of Express/path-to-regexp.
  app.get("/:any*", (_req, res) => {
    const indexPath = path.resolve(distPath, "index.html");
    
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send("Frontend build not found.");
    }
  });
}