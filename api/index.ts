import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes.js";
import { serveStatic } from "./static.js";
import { createServer } from "http";
import { runMigrations } from 'stripe-replit-sync';
import { getStripeSync } from './stripe/stripeClient.js';
import { WebhookHandlers } from './stripe/webhookHandlers.js';
import { seedPronunciationErrors } from './seed/pronunciationErrors.js';
import { seedCrosswords } from './crossword-seed.js';
import { authStorage } from './replit_integrations/auth/storage.js';

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

// 1. STRIPE INIT WITH RETRY LOGIC (To handle Neon Cold Starts)
async function initStripe() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return;

  // We try 3 times to give the database time to wake up
  for (let i = 0; i < 3; i++) {
    try {
      console.log(`[Stripe] Init attempt ${i + 1}...`);
      await runMigrations({ databaseUrl });
      
      const stripeSync = await getStripeSync();
      const domain = process.env.REPLIT_DOMAINS?.split(',')[0] || process.env.VERCEL_URL;
      const webhookBaseUrl = domain?.includes('://') ? domain : `https://${domain}`;
      
      await stripeSync.findOrCreateManagedWebhook(`${webhookBaseUrl}/api/stripe/webhook`);
      
      stripeSync.syncBackfill().catch((e: any) => console.error('[Stripe] Sync error:', e));
      console.log('[Stripe] Initialization successful!');
      return; 
    } catch (error) {
      console.warn(`[Stripe] Attempt ${i + 1} failed. DB might be waking up...`);
      if (i === 2) {
        console.error('[Stripe] Final attempt failed:', error);
        return;
      }
      // Wait 5 seconds before trying again
      await new Promise(res => setTimeout(res, 5000));
    }
  }
}

// 2. Webhook Route
app.post(
  '/api/stripe/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const signature = req.headers['stripe-signature'];
    if (!signature) return res.status(400).json({ error: 'Missing signature' });

    try {
      const sig = Array.isArray(signature) ? signature[0] : signature;
      await WebhookHandlers.processWebhook(req.body as Buffer, sig);
      res.status(200).json({ received: true });
    } catch (error: any) {
      console.error('Webhook error:', error.message);
      res.status(400).json({ error: 'Webhook processing error' });
    }
  }
);

// 3. Standard Middleware
app.use(express.json({ verify: (req, _res, buf) => { req.rawBody = buf; } }));
app.use(express.urlencoded({ extended: false }));

// 4. Main App Lifecycle
(async () => {
  // Run background tasks without 'await' so the server boots INSTANTLY
  initStripe().catch(err => console.error("Stripe init error:", err));
  seedPronunciationErrors().catch(err => console.error("Seed error:", err));
  seedCrosswords().catch(err => console.error("Seed error:", err));
  authStorage.upsertUser({
    id: "iflytek-ai",
    email: null,
    firstName: "AI Review",
    lastName: null,
    role: "reviewer",
  }).catch(err => console.error("User upsert error:", err));

  // Core routes
  await registerRoutes(httpServer, app);

  // Global Error Handler
  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || 500;
    console.error("Server Error:", err);
    if (res.headersSent) return next(err);
    res.status(status).json({ message: err.message || "Internal Server Error" });
  });

  // Static Assets
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite.js");
    await setupVite(httpServer, app);
  }

  // Local Start
  const port = parseInt(process.env.PORT || "5000", 10);
  if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
    httpServer.listen({ port, host: "0.0.0.0" }, () => console.log(`Serving on port ${port}`));
  }
})();

export default app;