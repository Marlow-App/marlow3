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

// Boilerplate for rawBody handling
declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

// 1. Stripe Initialization Logic
async function initStripe() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL required for Stripe integration');
    return;
  }

  try {
    console.log('Initializing Stripe schema...');
    await runMigrations({ databaseUrl });
    console.log('Stripe schema ready');

    const stripeSync = await getStripeSync();

    console.log('Setting up managed webhook...');
    // Fallback for Vercel environment where REPLIT_DOMAINS isn't present
    const domain = process.env.REPLIT_DOMAINS?.split(',')[0] || process.env.VERCEL_URL;
    const webhookBaseUrl = `https://${domain}`;
    
    const webhookResult = await stripeSync.findOrCreateManagedWebhook(
      `${webhookBaseUrl}/api/stripe/webhook`
    );
    console.log('Webhook configured:', JSON.stringify(webhookResult?.webhook?.url || webhookResult?.url || 'OK'));

    stripeSync.syncBackfill()
      .then(() => console.log('Stripe data synced'))
      .catch((err: any) => console.error('Error syncing Stripe data:', err));
  } catch (error) {
    console.error('Failed to initialize Stripe:', error);
  }
}

// 2. Webhook Route (Must come BEFORE express.json() middleware)
app.post(
  '/api/stripe/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const signature = req.headers['stripe-signature'];
    if (!signature) {
      return res.status(400).json({ error: 'Missing stripe-signature' });
    }

    try {
      const sig = Array.isArray(signature) ? signature[0] : signature;
      if (!Buffer.isBuffer(req.body)) {
        throw new Error('Payload is not a Buffer');
      }
      await WebhookHandlers.processWebhook(req.body as Buffer, sig);
      res.status(200).json({ received: true });
    } catch (error: any) {
      console.error('Webhook error:', error.message);
      res.status(400).json({ error: 'Webhook processing error' });
    }
  }
);

// 3. Standard Middleware
app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);
app.use(express.urlencoded({ extended: false }));

// Logging Utility
export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      log(logLine);
    }
  });
  next();
});

// 4. Main App Lifecycle
(async () => {
  // Run Initializations
initStripe().catch(err => console.error("Stripe init error:", err));
  await seedPronunciationErrors().catch(err => console.error("Error seeding pronunciation errors:", err));
  await seedCrosswords().catch(err => console.error("Error seeding crossword puzzles:", err));

  // Upsert AI system user
  await authStorage.upsertUser({
    id: "iflytek-ai",
    email: null,
    firstName: "AI Review",
    lastName: null,
    role: "reviewer",
  }).catch(err => console.error("Error upserting system user:", err));

  // Routes
  await registerRoutes(httpServer, app);

  // Global Error Handler
  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error("Internal Server Error:", err);
    if (res.headersSent) return next(err);
    res.status(status).json({ message });
  });

  // Static Assets / Vite
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite.js");
    await setupVite(httpServer, app);
  }

  // Local Server Start (Vercel ignores this, but useful for Replit/Local)
  const port = parseInt(process.env.PORT || "5000", 10);
  if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
    httpServer.listen({ port, host: "0.0.0.0" }, () => {
      log(`serving on port ${port}`);
    });
  }
})();

// 5. CRITICAL FIX: The Default Export for Vercel
export default app;