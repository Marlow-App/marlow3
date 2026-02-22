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
  app.get(api.recordings.list.path, isAuthenticated, async (req: any, res: any) => {
    try {
      const userId = (req.user as any).claims.sub;
      const recordings = await storage.getRecordingsByUser(userId);
      
      // Enhance with feedback and user info
      const recordingsEnhanced = await Promise.all(recordings.map(async (r: any) => {
        const user = await storage.getUser(r.userId);
        let feedback: any[] = [];
        // Ensure we check status correctly
        if (r.status === 'reviewed') {
          try {
            feedback = await storage.getFeedbackForRecording(r.id);
          } catch (e) {
            console.error(`Error fetching feedback for recording ${r.id}:`, e);
          }
        }
        return { ...r, feedback, user };
      }));

      res.json(recordingsEnhanced);
    } catch (error) {
      console.error("Error listing recordings:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // List all pending recordings (Control Center)
  app.get(api.recordings.listPending.path, isAuthenticated, async (req: any, res: any) => {
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
  app.get("/api/recordings", isAuthenticated, async (req: any, res: any) => {
    try {
      const recordings = await storage.getAllRecordings();
      const recordingsEnhanced = await Promise.all(recordings.map(async (r: any) => {
        const user = await storage.getUser(r.userId);
        let feedback: any[] = [];
        if (r.status === 'reviewed') {
          try {
            feedback = await storage.getFeedbackForRecording(r.id);
          } catch (e) {
            console.error(`Error fetching feedback for recording ${r.id}:`, e);
          }
        }
        return { ...r, feedback, user };
      }));
      res.json(recordingsEnhanced);
    } catch (error) {
      console.error("Error listing all recordings:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get single recording
  app.get(api.recordings.get.path, isAuthenticated, async (req: any, res: any) => {
    try {
      const recording = await storage.getRecording(Number(req.params.id));
      if (!recording) return res.status(404).json({ message: "Not found" });
      
      const user = await storage.getUser(recording.userId);
      const feedback = await storage.getFeedbackForRecording(recording.id);
      res.json({ ...recording, feedback, user });
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
