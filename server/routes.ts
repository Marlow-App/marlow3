import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { authStorage } from "./replit_integrations/auth/storage";
import { getUncachableStripeClient, getStripePublishableKey } from "./stripe/stripeClient";
import { sql } from "drizzle-orm";
import { db } from "./db";
import { generatePhraseAudio, getPhraseAudioFile } from "./elevenlabs";

async function seedDatabase() {
  // Check if we have any recordings
  const pending = await storage.getAllPendingRecordings();
  if (pending.length > 0) return;

  console.log("Seeding database...");

  // Create a learner user
  const learnerId = "learner-1";
  await authStorage.upsertUser({
    id: learnerId,
    email: "learner@example.com",
    firstName: "Lily",
    lastName: "Chen",
    profileImageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Lily",
  });

  // Create a native speaker user
  const teacherId = "teacher-1";
  await authStorage.upsertUser({
    id: teacherId,
    email: "teacher@example.com",
    firstName: "Teacher",
    lastName: "Wang",
    profileImageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Wang",
  });

  // Create a sample recording (Pending)
  await storage.createRecording(learnerId, {
    audioUrl: "https://actions.google.com/sounds/v1/alarms/beep_short.ogg", // Dummy audio
    sentenceText: "Nǐ hǎo (Hello)",
  });

  // Create a sample recording (Reviewed)
  const reviewedRec1 = await storage.createRecording(learnerId, {
    audioUrl: "https://actions.google.com/sounds/v1/alarms/beep_short.ogg",
    sentenceText: "Xièxiè (Thank you)",
  });

  // Add feedback
  await storage.createFeedback({
    recordingId: reviewedRec1.id,
    reviewerId: teacherId,
    textFeedback: "Great tone on 'xiè', but the second 'xie' should be neutral tone. It sounds like a falling tone here.",
    audioFeedbackUrl: "https://actions.google.com/sounds/v1/alarms/beep_short.ogg",
  } as any);

  // Create another sample recording (Reviewed)
  const reviewedRec2 = await storage.createRecording(learnerId, {
    audioUrl: "https://actions.google.com/sounds/v1/alarms/beep_short.ogg",
    sentenceText: "Xièxiè (Thank you)",
  });

  // Add feedback
  await storage.createFeedback({
    recordingId: reviewedRec2.id,
    reviewerId: teacherId,
    textFeedback: "Great tone on 'xiè', but the second 'xie' should be neutral tone. It sounds like a falling tone here.",
    audioFeedbackUrl: "https://actions.google.com/sounds/v1/alarms/beep_short.ogg",
  } as any);

  console.log("Database seeded!");
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup Auth
  await setupAuth(app);
  registerAuthRoutes(app);

  // Setup Object Storage
  registerObjectStorageRoutes(app);

  // Seed Data
  seedDatabase().catch(console.error);

  // === Recordings ===

  // List my recordings (for learners) or all recordings (for reviewers)
  app.get(api.recordings.list.path, isAuthenticated, async (req, res) => {
    try {
      const user = (req.user as any);
      const userId = user.claims.sub;
      const dbUser = await storage.getUser(userId);
      
      let recordings;
      if (dbUser?.role === 'reviewer') {
        recordings = await storage.getAllRecordings();
      } else {
        recordings = await storage.getRecordingsByUser(userId);
      }
      
      const recordingsEnhanced = await Promise.all(recordings.map(async (r: any) => {
        const u = await storage.getUser(r.userId);
        let feedbackList: any[] = [];
        if (r.status === 'reviewed') {
          try {
            const rawFeedback = await storage.getFeedbackForRecording(r.id);
            feedbackList = await Promise.all(rawFeedback.map(async (f: any) => {
              const reviewer = await storage.getUser(f.reviewerId);
              return { ...f, reviewer };
            }));
          } catch (e) {
            console.error(`Error fetching feedback for recording ${r.id}:`, e);
          }
        }
        return { ...r, feedback: feedbackList, user: u };
      }));

      res.json(recordingsEnhanced);
    } catch (error) {
      console.error("Error listing recordings:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // List all pending recordings (Control Center)
  app.get(api.recordings.listPending.path, isAuthenticated, async (req, res) => {
    try {
      const pending = await storage.getAllPendingRecordings();
      const pendingWithUser = await Promise.all(pending.map(async (r: any) => {
        const user = await storage.getUser(r.userId);
        return { ...r, user };
      }));
      res.json(pendingWithUser);
    } catch (error) {
      console.error("Error listing pending recordings:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // List all recordings (Admin/Reviewer view for completed)
  app.get("/api/all-recordings", isAuthenticated, async (req, res) => {
    try {
      const recordings = await storage.getAllRecordings();
      
      const recordingsEnhanced = await Promise.all(recordings.map(async (r: any) => {
        const user = await storage.getUser(r.userId);
        let feedbackList: any[] = [];
        try {
          const rawFeedback = await storage.getFeedbackForRecording(r.id);
          feedbackList = await Promise.all(rawFeedback.map(async (f: any) => {
            const reviewer = await storage.getUser(f.reviewerId);
            return { ...f, reviewer };
          }));
        } catch (e) {
          console.error(`Error fetching feedback for recording ${r.id}:`, e);
        }
        return { ...r, feedback: feedbackList, user };
      }));
      res.json(recordingsEnhanced);
    } catch (error) {
      console.error("Error listing all recordings:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get single recording
  app.get(api.recordings.get.path, isAuthenticated, async (req, res) => {
    try {
      const recording = await storage.getRecording(Number(req.params.id));
      if (!recording) return res.status(404).json({ message: "Not found" });
      
      const user = await storage.getUser(recording.userId);
      const rawFeedback = await storage.getFeedbackForRecording(recording.id);
      const feedbackWithReviewer = await Promise.all(rawFeedback.map(async (f: any) => {
        const reviewer = await storage.getUser(f.reviewerId);
        return { ...f, reviewer };
      }));
      res.json({ ...recording, feedback: feedbackWithReviewer, user });
    } catch (error) {
      console.error("Error getting recording:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Create recording
  app.post(api.recordings.create.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.recordings.create.input.parse(req.body);
      const userId = (req.user as any).claims.sub;
      const userEmail = (req.user as any).claims.email;

      const UNLIMITED_EMAIL = "jujusees@gmail.com";
      const isUnlimited = userEmail === UNLIMITED_EMAIL;

      let dailyLimit = 1;

      if (!isUnlimited) {
        const user = await storage.getUser(userId);
        if (user?.stripeCustomerId) {
          const subResult = await db.execute(
            sql`SELECT s.status, p.metadata as product_metadata
              FROM stripe.subscriptions s
              LEFT JOIN stripe.prices pr ON s.items->0->'price'->>'id' = pr.id
              LEFT JOIN stripe.products p ON pr.product = p.id
              WHERE s.customer = ${user.stripeCustomerId}
              AND s.status IN ('active', 'trialing')
              LIMIT 1`
          );
          const sub = subResult.rows[0] as any;
          if (sub) {
            const tier = typeof sub.product_metadata === 'string'
              ? JSON.parse(sub.product_metadata)?.tier
              : sub.product_metadata?.tier;
            if (tier === 'max') {
              dailyLimit = 15;
            } else if (tier === 'starter') {
              dailyLimit = 5;
            }
          }
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const userRecordings = await storage.getRecordingsByUser(userId);
        const todaysRecordings = userRecordings.filter(r => new Date(r.createdAt) >= today);

        if (todaysRecordings.length >= dailyLimit) {
          const tierName = dailyLimit === 1 ? 'free' : dailyLimit === 5 ? 'Pro Starter' : 'Pro Max';
          const upgradeMsg = dailyLimit < 15
            ? ' Upgrade your plan for more recordings!'
            : '';
          return res.status(403).json({
            message: `Daily limit of ${dailyLimit} recording${dailyLimit > 1 ? 's' : ''} reached (${tierName}).${upgradeMsg}`,
            dailyLimit,
            used: todaysRecordings.length,
          });
        }
      }

      const recording = await storage.createRecording(userId, input);
      res.status(201).json(recording);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
        return;
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // === Feedback ===

  app.post(api.feedback.create.path, isAuthenticated, async (req, res) => {
    try {
      const recordingId = Number(req.params.id);
      const input = api.feedback.create.input.parse({
        ...req.body,
        recordingId,
      });
      const reviewerId = (req.user as any).claims.sub;

      const ratingValue = input.rating;
      if (ratingValue !== undefined && ratingValue !== null) {
        if (!Number.isInteger(ratingValue) || ratingValue < 1 || ratingValue > 3) {
          return res.status(400).json({ message: "Rating must be 1, 2, or 3" });
        }
      }

      const feedback = await storage.createFeedback({
        recordingId,
        textFeedback: input.textFeedback,
        audioFeedbackUrl: input.audioFeedbackUrl,
        rating: ratingValue ?? null,
        reviewerId,
      } as any);
      
      res.status(201).json(feedback);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
        return;
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // === User Profile ===
  app.patch("/api/auth/user", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const updates = req.body;
      
      const updatedUser = await authStorage.upsertUser({
        id: userId,
        ...updates,
      });
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // === Stripe Payment Routes ===

  app.get("/api/stripe/publishable-key", async (_req, res) => {
    try {
      const key = await getStripePublishableKey();
      res.json({ publishableKey: key });
    } catch (error) {
      console.error("Error getting Stripe publishable key:", error);
      res.status(500).json({ message: "Payment system unavailable" });
    }
  });

  app.get("/api/stripe/products", async (_req, res) => {
    try {
      const result = await db.execute(
        sql`SELECT 
          p.id as product_id,
          p.name as product_name,
          p.description as product_description,
          p.metadata as product_metadata,
          pr.id as price_id,
          pr.unit_amount,
          pr.currency,
          pr.recurring
        FROM stripe.products p
        LEFT JOIN stripe.prices pr ON pr.product = p.id AND pr.active = true
        WHERE p.active = true
        ORDER BY pr.unit_amount ASC`
      );

      const productsMap = new Map();
      for (const row of result.rows as any[]) {
        if (!productsMap.has(row.product_id)) {
          productsMap.set(row.product_id, {
            id: row.product_id,
            name: row.product_name,
            description: row.product_description,
            metadata: row.product_metadata,
            prices: []
          });
        }
        if (row.price_id) {
          productsMap.get(row.product_id).prices.push({
            id: row.price_id,
            unit_amount: row.unit_amount,
            currency: row.currency,
            recurring: row.recurring,
          });
        }
      }

      const dbProducts = Array.from(productsMap.values());
      if (dbProducts.length > 0) {
        return res.json(dbProducts);
      }

      console.log("No products in database, fetching from Stripe API...");
      const stripe = await getUncachableStripeClient();
      const [stripeProducts, stripePrices] = await Promise.all([
        stripe.products.list({ active: true, limit: 100 }),
        stripe.prices.list({ active: true, limit: 100 }),
      ]);

      const apiProductsMap = new Map();
      for (const product of stripeProducts.data) {
        apiProductsMap.set(product.id, {
          id: product.id,
          name: product.name,
          description: product.description,
          metadata: product.metadata,
          prices: [],
        });
      }
      for (const price of stripePrices.data) {
        const productId = typeof price.product === 'string' ? price.product : price.product?.toString();
        if (apiProductsMap.has(productId)) {
          apiProductsMap.get(productId).prices.push({
            id: price.id,
            unit_amount: price.unit_amount,
            currency: price.currency,
            recurring: price.recurring,
          });
        }
      }

      const apiProducts = Array.from(apiProductsMap.values())
        .filter((p: any) => p.prices.length > 0)
        .sort((a: any, b: any) => (a.prices[0]?.unit_amount || 0) - (b.prices[0]?.unit_amount || 0));

      res.json(apiProducts);
    } catch (error) {
      console.error("Error listing products:", error);
      res.json([]);
    }
  });

  app.post("/api/stripe/checkout", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const { priceId } = req.body;

      if (!priceId) {
        return res.status(400).json({ message: "priceId is required" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const stripe = await getUncachableStripeClient();

      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email || undefined,
          metadata: { userId: user.id },
        });
        customerId = customer.id;
        await authStorage.upsertUser({
          id: userId,
          stripeCustomerId: customerId,
        });
      }

      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        mode: 'subscription',
        success_url: `${baseUrl}/checkout/success`,
        cancel_url: `${baseUrl}/profile`,
      });

      res.json({ url: session.url });
    } catch (error) {
      console.error("Error creating checkout session:", error);
      res.status(500).json({ message: "Failed to create checkout session" });
    }
  });

  app.get("/api/stripe/subscription", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const user = await storage.getUser(userId);

      if (!user?.stripeCustomerId) {
        return res.json({ subscription: null });
      }

      const stripe = await getUncachableStripeClient();

      let sub: any = null;

      const subscriptions = await stripe.subscriptions.list({
        customer: user.stripeCustomerId,
        status: 'active',
        limit: 1,
      });

      if (subscriptions.data.length > 0) {
        sub = subscriptions.data[0];
      } else {
        const allSubscriptions = await stripe.subscriptions.list({
          customer: user.stripeCustomerId,
          status: 'all',
          limit: 5,
        });
        sub = allSubscriptions.data.find(
          s => s.status === 'active' || s.status === 'trialing'
        ) || null;
      }

      if (sub) {
        const priceItem = sub.items?.data?.[0]?.price;
        if (priceItem?.product && typeof priceItem.product === 'string') {
          const product = await stripe.products.retrieve(priceItem.product);
          priceItem.product = product;
        }

        if (!user.stripeSubscriptionId) {
          await authStorage.upsertUser({
            id: userId,
            stripeSubscriptionId: sub.id,
          });
        }
      }

      res.json({ subscription: sub });
    } catch (error) {
      console.error("Error getting subscription:", error);
      res.json({ subscription: null });
    }
  });

  app.post("/api/phrase-audio/generate", isAuthenticated, async (req, res) => {
    try {
      const { text } = req.body;
      if (!text || typeof text !== "string" || text.length > 100) {
        return res.status(400).json({ message: "Invalid text" });
      }
      const audioUrl = await generatePhraseAudio(text);
      res.json({ audioUrl });
    } catch (error: any) {
      console.error("Error generating phrase audio:", error);
      res.status(500).json({ message: error.message || "Failed to generate audio" });
    }
  });

  app.get("/api/phrase-audio/:hash", async (req, res) => {
    try {
      const { hash } = req.params;
      if (!/^[a-f0-9]{12}$/.test(hash)) {
        return res.status(400).json({ message: "Invalid hash" });
      }
      const file = await getPhraseAudioFile(hash);
      if (!file) {
        return res.status(404).json({ message: "Audio not found" });
      }
      const [metadata] = await file.getMetadata();
      const size = Number(metadata.size);
      res.writeHead(200, {
        "Content-Type": "audio/mpeg",
        "Content-Length": size,
        "Cache-Control": "public, max-age=31536000, immutable",
        "Accept-Ranges": "bytes",
      });
      file.createReadStream().pipe(res);
    } catch (error) {
      console.error("Error serving phrase audio:", error);
      if (!res.headersSent) {
        res.status(500).json({ message: "Failed to serve audio" });
      }
    }
  });

  app.post("/api/stripe/portal", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const user = await storage.getUser(userId);

      if (!user?.stripeCustomerId) {
        return res.status(400).json({ message: "No subscription found" });
      }

      const stripe = await getUncachableStripeClient();
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const session = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${baseUrl}/learner-portal`,
      });

      res.json({ url: session.url });
    } catch (error) {
      console.error("Error creating portal session:", error);
      res.status(500).json({ message: "Failed to create portal session" });
    }
  });

  app.post("/api/stripe/switch-plan", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const { newPriceId } = req.body;

      if (!newPriceId) {
        return res.status(400).json({ message: "newPriceId is required" });
      }

      const user = await storage.getUser(userId);
      if (!user?.stripeCustomerId) {
        return res.status(400).json({ message: "No active subscription found" });
      }

      const stripe = await getUncachableStripeClient();
      const subscriptions = await stripe.subscriptions.list({
        customer: user.stripeCustomerId,
        status: 'active',
        limit: 1,
      });

      if (subscriptions.data.length === 0) {
        return res.status(400).json({ message: "No active subscription found" });
      }

      const subscription = subscriptions.data[0];
      const subscriptionItemId = subscription.items.data[0].id;

      const updated = await stripe.subscriptions.update(subscription.id, {
        items: [{
          id: subscriptionItemId,
          price: newPriceId,
        }],
        proration_behavior: 'create_prorations',
      });

      res.json({ subscription: updated });
    } catch (error) {
      console.error("Error switching plan:", error);
      res.status(500).json({ message: "Failed to switch plan" });
    }
  });

  app.post("/api/stripe/cancel", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const user = await storage.getUser(userId);

      if (!user?.stripeCustomerId) {
        return res.status(400).json({ message: "No active subscription found" });
      }

      const stripe = await getUncachableStripeClient();
      const subscriptions = await stripe.subscriptions.list({
        customer: user.stripeCustomerId,
        status: 'active',
        limit: 1,
      });

      if (subscriptions.data.length === 0) {
        return res.status(400).json({ message: "No active subscription found" });
      }

      const updated = await stripe.subscriptions.update(subscriptions.data[0].id, {
        cancel_at_period_end: true,
      });

      res.json({ subscription: updated });
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      res.status(500).json({ message: "Failed to cancel subscription" });
    }
  });

  app.post("/api/stripe/reactivate", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const user = await storage.getUser(userId);

      if (!user?.stripeCustomerId) {
        return res.status(400).json({ message: "No subscription found" });
      }

      const stripe = await getUncachableStripeClient();
      const subscriptions = await stripe.subscriptions.list({
        customer: user.stripeCustomerId,
        limit: 1,
      });

      if (subscriptions.data.length === 0) {
        return res.status(400).json({ message: "No subscription found" });
      }

      const updated = await stripe.subscriptions.update(subscriptions.data[0].id, {
        cancel_at_period_end: false,
      });

      res.json({ subscription: updated });
    } catch (error) {
      console.error("Error reactivating subscription:", error);
      res.status(500).json({ message: "Failed to reactivate subscription" });
    }
  });

  return httpServer;
}
