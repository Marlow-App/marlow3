import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { authStorage } from "./replit_integrations/auth/storage";

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
    status: "pending",
  });

  // Create a sample recording (Reviewed)
  const reviewedRec = await storage.createRecording(learnerId, {
    audioUrl: "https://actions.google.com/sounds/v1/alarms/beep_short.ogg",
    sentenceText: "Xièxiè (Thank you)",
    status: "reviewed",
  });

  // Add feedback
  await storage.createFeedback({
    recordingId: reviewedRec.id,
    reviewerId: teacherId,
    textFeedback: "Great tone on 'xiè', but the second 'xie' should be neutral tone. It sounds like a falling tone here.",
    audioFeedbackUrl: "https://actions.google.com/sounds/v1/alarms/beep_short.ogg",
  });
  
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

  // List my recordings
  app.get(api.recordings.list.path, isAuthenticated, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    const recordings = await storage.getRecordingsByUser(userId);
    
    // Enhance with feedback if reviewed
    const recordingsWithFeedback = await Promise.all(recordings.map(async (r) => {
      if (r.status === 'reviewed') {
        const feedback = await storage.getFeedbackForRecording(r.id);
        return { ...r, feedback };
      }
      return r;
    }));

    res.json(recordingsWithFeedback);
  });

  // List all pending recordings (Control Center)
  // In a real app, you'd check if user is admin/teacher
  app.get(api.recordings.listPending.path, isAuthenticated, async (req, res) => {
    const pending = await storage.getAllPendingRecordings();
    res.json(pending);
  });

  // Get single recording
  app.get(api.recordings.get.path, isAuthenticated, async (req, res) => {
    const recording = await storage.getRecording(Number(req.params.id));
    if (!recording) return res.status(404).json({ message: "Not found" });
    
    const feedback = await storage.getFeedbackForRecording(recording.id);
    res.json({ ...recording, feedback });
  });

  // Create recording
  app.post(api.recordings.create.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.recordings.create.input.parse(req.body);
      const userId = (req.user as any).claims.sub;
      
      // Basic rate limiting check (1 per day)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const dailyLimit = 50;
      const userRecordings = await storage.getRecordingsByUser(userId);
      const todaysRecordings = userRecordings.filter(r => new Date(r.createdAt) >= today);
      
      if (todaysRecordings.length >= dailyLimit) {
         return res.status(403).json({ message: "Daily limit reached. Upgrade to Premium for more." });
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

      const feedback = await storage.createFeedback({
        ...input,
        reviewerId,
      });
      
      res.status(201).json(feedback);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
        return;
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  return httpServer;
}
