import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { authStorage } from "./replit_integrations/auth/storage";
import { getUncachableStripeClient, getStripePublishableKey } from "./stripe/stripeClient";
import { db } from "./db";
import { generatePhraseAudio, getPhraseAudioFile } from "./elevenlabs";
import { countChineseChars, MAX_CHARS, REFUND_THRESHOLD, CREDIT_PACKS } from "@shared/credits";

const UNLIMITED_EMAIL = process.env.UNLIMITED_CREDITS_EMAIL ?? null;

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup Auth
  await setupAuth(app);
  registerAuthRoutes(app);

  // Setup Object Storage
  registerObjectStorageRoutes(app);

  // === Consent ===

  app.get("/api/consent", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const hasConsented = await storage.hasUserConsented(userId);
      res.json({ consented: hasConsented });
    } catch (error) {
      console.error("Error checking consent:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const consentSchema = z.object({
    consentTypes: z.array(
      z.enum(["age_verification", "terms_of_service", "privacy_policy", "voice_data_processing"])
    ).length(4),
  });

  app.post("/api/consent", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const parsed = consentSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "All four consent types must be provided" });
      }

      const ipAddress = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.ip || "unknown";
      const policyVersion = "2026-02-28";

      await storage.saveConsents(userId, parsed.data.consentTypes, policyVersion, ipAddress);
      res.json({ success: true });
    } catch (error) {
      console.error("Error saving consent:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // === Onboarding ===

  const onboardingSchema = z.object({
    chineseLevel: z.string().min(1),
    nativeLanguage: z.string().min(1),
    focusAreas: z.array(z.string()).min(1),
  });

  app.post("/api/onboarding", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const parsed = onboardingSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid onboarding data" });
      }

      const updatedUser = await authStorage.upsertUser({
        id: userId,
        chineseLevel: parsed.data.chineseLevel,
        nativeLanguage: parsed.data.nativeLanguage,
        focusAreas: parsed.data.focusAreas,
        onboardingComplete: true,
      });

      // Grant signup bonus idempotently
      await storage.grantSignupBonus(userId);

      res.json(updatedUser);
    } catch (error) {
      console.error("Error saving onboarding:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // === Credits ===

  app.get("/api/credits/balance", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const userEmail = (req.user as any).claims.email;

      if (userEmail === UNLIMITED_EMAIL) {
        return res.json({ creditBalance: 999, freeCreditsBalance: 0, isUnlimited: true });
      }

      // Fire-and-forget daily reward
      storage.grantDailyReward(userId).catch(console.error);

      const user = await storage.getUser(userId);
      res.json({
        creditBalance: user?.creditBalance ?? 0,
        freeCreditsBalance: user?.freeCreditsBalance ?? 0,
        isUnlimited: false,
      });
    } catch (error) {
      console.error("Error getting credit balance:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/credits/transactions", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const transactions = await storage.getCreditTransactions(userId);
      res.json(transactions);
    } catch (error) {
      console.error("Error getting transactions:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

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
      const userId = (req.user as any).claims.sub;
      const dbUser = await storage.getUser(userId);
      if (dbUser?.role !== "reviewer") {
        return res.status(403).json({ message: "Reviewers only" });
      }
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
      const userId = (req.user as any).claims.sub;
      const dbUser = await storage.getUser(userId);
      if (dbUser?.role !== "reviewer") {
        return res.status(403).json({ message: "Reviewers only" });
      }
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

  // Get child re-recordings for a recording
  app.get("/api/recordings/:id/children", isAuthenticated, async (req, res) => {
    try {
      const parentId = Number(req.params.id);
      const children = await storage.getChildRecordings(parentId);
      const childrenWithFeedback = await Promise.all(children.map(async (child) => {
        const rawFeedback = await storage.getFeedbackForRecording(child.id);
        const feedbackWithReviewer = await Promise.all(rawFeedback.map(async (f: any) => {
          const reviewer = await storage.getUser(f.reviewerId);
          return { ...f, reviewer };
        }));
        return { ...child, feedback: feedbackWithReviewer };
      }));
      res.json(childrenWithFeedback);
    } catch (error) {
      console.error("Error getting child recordings:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/recordings/:id", isAuthenticated, async (req, res) => {
    try {
      const recordingId = Number(req.params.id);
      const userId = (req.user as any).claims.sub;
      const user = await storage.getUser(userId);
      const recording = await storage.getRecording(recordingId);

      if (!recording) {
        return res.status(404).json({ message: "Recording not found" });
      }

      const isOwner = recording.userId === userId;
      const isReviewer = user?.role === "reviewer";

      if (!isOwner && !isReviewer) {
        return res.status(403).json({ message: "Not authorized to delete this recording" });
      }

      const deleted = await storage.deleteRecording(recordingId);
      if (!deleted) {
        return res.status(500).json({ message: "Failed to delete recording" });
      }

      res.json({ message: "Recording deleted" });
    } catch (error) {
      console.error("Error deleting recording:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Create recording
  app.post(api.recordings.create.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.recordings.create.input.parse(req.body);
      const { rerecordOf, ...recordingData } = input;
      const userId = (req.user as any).claims.sub;
      const userEmail = (req.user as any).claims.email;

      const isUnlimited = userEmail === UNLIMITED_EMAIL;

      const charCount = countChineseChars(recordingData.sentenceText);

      // Validate re-record parent if provided
      let parentRecordingId: number | undefined;
      let rerecordDiscount: "free" | "thirty_pct" | null = null;
      if (rerecordOf) {
        const parent = await storage.getRecording(rerecordOf);
        if (!parent || parent.userId !== userId) {
          return res.status(403).json({ message: "Invalid parent recording." });
        }
        parentRecordingId = parent.id;
        rerecordDiscount = parent.status === "pending" ? "free" : "thirty_pct";
      }

      if (!isUnlimited) {
        if (charCount > MAX_CHARS) {
          return res.status(400).json({
            message: `Recording text too long. Maximum ${MAX_CHARS} Chinese characters allowed.`,
            charCount,
            max: MAX_CHARS,
          });
        }

        if (charCount === 0) {
          return res.status(400).json({ message: "Please include at least one Chinese character." });
        }

        const discountedCost = rerecordDiscount === "free"
          ? 0
          : rerecordDiscount === "thirty_pct"
            ? Math.ceil(charCount * 0.7)
            : charCount;

        const user = await storage.getUser(userId);
        const balance = user?.creditBalance ?? 0;
        if (balance < discountedCost) {
          return res.status(402).json({
            message: `Not enough credits. This recording costs ${discountedCost} credit${discountedCost > 1 ? 's' : ''} but you only have ${balance}.`,
            required: discountedCost,
            balance,
          });
        }
      }

      const fullCost = isUnlimited ? 0 : charCount;
      const creditCost = isUnlimited ? 0
        : rerecordDiscount === "free" ? 0
        : rerecordDiscount === "thirty_pct" ? Math.ceil(fullCost * 0.7)
        : fullCost;

      const recording = await storage.createRecording(userId, recordingData, creditCost, parentRecordingId);

      if (!isUnlimited && creditCost > 0) {
        await storage.spendCredits(userId, recording.id, creditCost);
      }

      res.status(201).json(recording);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
        return;
      }
      console.error("Error creating recording:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // === Feedback ===

  app.post(api.feedback.create.path, isAuthenticated, async (req, res) => {
    try {
      const recordingId = Number(req.params.id);
      const reviewerId = (req.user as any).claims.sub;
      const { textFeedback, corrections, audioFeedbackUrl, characterRatings, fluencyScore } = req.body;

      if (!textFeedback && !corrections && !audioFeedbackUrl) {
        return res.status(400).json({ message: "Feedback text, corrections, or audio is required" });
      }

      let overallScore: number | null = null;
      let validatedRatings: any = null;
      let validatedFluency: number | null = null;

      if (fluencyScore !== undefined && fluencyScore !== null) {
        const f = Number(fluencyScore);
        if (!Number.isInteger(f) || f < 1 || f > 5) {
          return res.status(400).json({ message: "Fluency score must be an integer from 1 to 5" });
        }
        validatedFluency = f;
      }

      if (characterRatings && Array.isArray(characterRatings) && characterRatings.length > 0) {
        const { characterRatingSchema } = await import("@shared/schema");
        for (const cr of characterRatings) {
          characterRatingSchema.parse(cr);
        }
        validatedRatings = characterRatings;
        const charTotal = characterRatings.reduce((sum: number, cr: any) => sum + cr.initial + cr.final + cr.tone, 0);
        const charScore = charTotal / (characterRatings.length * 3);
        if (validatedFluency !== null) {
          const fluencyPct = validatedFluency * 20;
          overallScore = Math.round(charScore * 0.8 + fluencyPct * 0.2);
        } else {
          overallScore = Math.round(charScore);
        }
      }

      const feedbackRecord = await storage.createFeedback({
        recordingId,
        textFeedback: textFeedback || "",
        corrections: corrections || null,
        audioFeedbackUrl: audioFeedbackUrl || null,
        rating: null,
        characterRatings: validatedRatings,
        fluencyScore: validatedFluency,
        overallScore,
        reviewerId,
      } as any);

      // Refund credits if score >= REFUND_THRESHOLD
      if (overallScore !== null && overallScore >= REFUND_THRESHOLD) {
        storage.refundCredits(recordingId).catch(console.error);
      }

      res.status(201).json(feedbackRecord);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
        return;
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update feedback (reviewer only, own feedback)
  app.patch("/api/feedback/:id", isAuthenticated, async (req, res) => {
    try {
      const feedbackId = Number(req.params.id);
      const reviewerId = (req.user as any).claims.sub;

      const existing = await storage.getFeedback(feedbackId);
      if (!existing) return res.status(404).json({ message: "Feedback not found" });
      if (existing.reviewerId !== reviewerId) return res.status(403).json({ message: "You can only edit your own feedback" });

      const { textFeedback, corrections, audioFeedbackUrl, characterRatings, fluencyScore } = req.body;

      let overallScore: number | null = existing.overallScore;
      let validatedRatings: any = undefined;
      let validatedFluency: number | null | undefined = undefined;

      if (fluencyScore !== undefined) {
        if (fluencyScore === null) {
          validatedFluency = null;
        } else {
          const f = Number(fluencyScore);
          if (!Number.isInteger(f) || f < 1 || f > 5) {
            return res.status(400).json({ message: "Fluency score must be an integer from 1 to 5" });
          }
          validatedFluency = f;
        }
      }

      if (characterRatings !== undefined) {
        if (characterRatings && Array.isArray(characterRatings) && characterRatings.length > 0) {
          const { characterRatingSchema } = await import("@shared/schema");
          for (const cr of characterRatings) {
            characterRatingSchema.parse(cr);
          }
          validatedRatings = characterRatings;
        } else {
          validatedRatings = null;
        }
      }

      const effectiveRatings = validatedRatings !== undefined ? validatedRatings : (existing.characterRatings || null);
      const effectiveFluency = validatedFluency !== undefined ? validatedFluency : (existing.fluencyScore ?? null);

      if (effectiveRatings && Array.isArray(effectiveRatings) && effectiveRatings.length > 0) {
        const charTotal = effectiveRatings.reduce((sum: number, cr: any) => sum + cr.initial + cr.final + cr.tone, 0);
        const charScore = charTotal / (effectiveRatings.length * 3);
        if (effectiveFluency !== null) {
          overallScore = Math.round(charScore * 0.8 + (effectiveFluency * 20) * 0.2);
        } else {
          overallScore = Math.round(charScore);
        }
      } else {
        overallScore = null;
      }

      const updateData: any = {};
      if (textFeedback !== undefined) updateData.textFeedback = textFeedback;
      if (corrections !== undefined) updateData.corrections = corrections || null;
      if (audioFeedbackUrl !== undefined) updateData.audioFeedbackUrl = audioFeedbackUrl;
      if (validatedRatings !== undefined) updateData.characterRatings = validatedRatings;
      if (validatedFluency !== undefined) updateData.fluencyScore = validatedFluency;
      updateData.overallScore = overallScore;

      const updated = await storage.updateFeedback(feedbackId, updateData);

      // Refund credits if score >= REFUND_THRESHOLD (idempotent — won't double-refund)
      if (overallScore !== null && overallScore >= REFUND_THRESHOLD) {
        storage.refundCredits(existing.recordingId).catch(console.error);
      }

      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      console.error("Error updating feedback:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Delete feedback (reviewer only, own feedback)
  app.delete("/api/feedback/:id", isAuthenticated, async (req, res) => {
    try {
      const feedbackId = Number(req.params.id);
      const reviewerId = (req.user as any).claims.sub;

      const existing = await storage.getFeedback(feedbackId);
      if (!existing) return res.status(404).json({ message: "Feedback not found" });
      if (existing.reviewerId !== reviewerId) return res.status(403).json({ message: "You can only delete your own feedback" });

      const deleted = await storage.deleteFeedback(feedbackId);
      if (!deleted) return res.status(500).json({ message: "Failed to delete feedback" });

      res.json({ message: "Feedback deleted" });
    } catch (err) {
      console.error("Error deleting feedback:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // === User Profile ===
  const profileUpdateSchema = z.object({
    chineseLevel: z.string().min(1).max(100).optional(),
    nativeLanguage: z.string().min(1).max(100).optional(),
    focusAreas: z.array(z.string()).min(1).optional(),
    city: z.string().max(100).optional(),
    teachingExperience: z.number().int().min(0).max(100).optional(),
    dialects: z.array(z.string()).optional(),
  });

  app.patch("/api/auth/user", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const parsed = profileUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0].message });
      }

      const updatedUser = await authStorage.upsertUser({
        id: userId,
        ...parsed.data,
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

  // Credit pack checkout (one-time payment)
  app.post("/api/stripe/checkout", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const { usd } = req.body;

      const pack = CREDIT_PACKS.find(p => p.usd === usd);
      if (!pack) {
        return res.status(400).json({ message: "Invalid credit pack" });
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
        await authStorage.upsertUser({ id: userId, stripeCustomerId: customerId });
      }

      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'usd',
            unit_amount: pack.usd * 100,
            product_data: {
              name: `${pack.credits} Marlow Credits`,
              description: `${pack.credits} credits for tone practice recordings`,
            },
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: `${baseUrl}/checkout/success?credits=${pack.credits}`,
        cancel_url: `${baseUrl}/profile`,
        metadata: {
          userId: user.id,
          credits: String(pack.credits),
        },
      });

      res.json({ url: session.url });
    } catch (error) {
      console.error("Error creating checkout session:", error);
      res.status(500).json({ message: "Failed to create checkout session" });
    }
  });

  // === Phrase Audio ===

  app.post("/api/phrase-audio/generate", isAuthenticated, async (req, res) => {
    try {
      const { text } = req.body;
      if (!text || typeof text !== "string" || text.length > 100) {
        return res.status(400).json({ message: "Invalid text" });
      }
      const audioUrl = await generatePhraseAudio(text);
      res.json({ audioUrl });
    } catch (error) {
      console.error("Error generating phrase audio:", error);
      res.status(500).json({ message: "Failed to generate audio" });
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

  return httpServer;
}
