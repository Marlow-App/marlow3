import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Re-defining __dirname for ESM environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");

  // Log error if public folder is missing, but don't crash the server
  if (!fs.existsSync(distPath)) {
    console.error(`[Static] Build directory missing at: ${distPath}`);
  }

  // 1. Serve physical files (js, css, png, etc.)
  // { index: false } prevents it from trying to serve index.html automatically
  app.use(express.static(distPath, { index: false }));

  // 2. The Universal Catch-All Middleware
  // This replaces app.get("(.*)") to avoid the path-to-regexp library errors
  app.use((req, res, next) => {
    // If the request is for the API, let it pass through to the error handlers
    if (req.path.startsWith('/api')) {
      return next();
    }

    // For all other requests (navigation), serve the index.html
    const indexPath = path.resolve(distPath, "index.html");
    
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      // If index.html is missing, we hand off to the next middleware (likely a 404)
      next();
    }
  });
}