import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function serveStatic(app: Express) {
  // We check multiple locations because Vercel's file structure 
  // changes depending on how the build is configured.
  const possiblePaths = [
    path.resolve(__dirname, "public"),         // /var/task/api/public
    path.resolve(__dirname, "..", "public"),    // /var/task/public (Most likely)
    path.resolve(process.cwd(), "public"),     // Current working directory/public
    path.resolve(process.cwd(), "dist/public") // Root/dist/public
  ];

  // Find the first path that actually exists
  const distPath = possiblePaths.find(p => fs.existsSync(p)) || possiblePaths[0];

  console.log(`[Static] Verified Path: ${distPath}`);

  if (!fs.existsSync(distPath)) {
    console.error(`[Static] CRITICAL: No build directory found. Checked: ${possiblePaths.join(", ")}`);
  }

  // 1. Serve physical files
  app.use(express.static(distPath, { index: false }));

  // 2. Catch-all for SPA routing
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }

    const indexPath = path.resolve(distPath, "index.html");
    
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      console.error(`[Static] index.html missing at: ${indexPath}`);
      next();
    }
  });
}