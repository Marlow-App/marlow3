import { db } from "./db";
import {
  recordings,
  feedback,
  users,
  type InsertRecording,
  type InsertFeedback,
  type Recording,
  type Feedback,
  type User
} from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";
import { authStorage } from "./replit_integrations/auth/storage"; // Reuse auth storage for user lookups if needed

export interface IStorage {
  // Recordings
  createRecording(userId: string, recording: InsertRecording): Promise<Recording>;
  getRecording(id: number): Promise<Recording | undefined>;
  getRecordingsByUser(userId: string): Promise<Recording[]>;
  getAllPendingRecordings(): Promise<(Recording & { user: User | null })[]>;
  
  // Feedback
  createFeedback(feedbackData: InsertFeedback): Promise<Feedback>;
  getFeedbackForRecording(recordingId: number): Promise<Feedback[]>;
  
  // Users (helper)
  getUser(id: string): Promise<User | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    return authStorage.getUser(id);
  }

  async createRecording(userId: string, recording: InsertRecording): Promise<Recording> {
    const [newRecording] = await db
      .insert(recordings)
      .values({ ...recording, userId })
      .returning();
    return newRecording;
  }

  async getRecording(id: number): Promise<Recording | undefined> {
    const [recording] = await db
      .select()
      .from(recordings)
      .where(eq(recordings.id, id));
    return recording;
  }

  async getRecordingsByUser(userId: string): Promise<Recording[]> {
    return db
      .select()
      .from(recordings)
      .where(eq(recordings.userId, userId))
      .orderBy(desc(recordings.createdAt));
  }

  async getAllPendingRecordings(): Promise<(Recording & { user: User | null })[]> {
    const results = await db
      .select({
        recording: recordings,
        user: users,
      })
      .from(recordings)
      .leftJoin(users, eq(recordings.userId, users.id))
      .where(eq(recordings.status, "pending"))
      .orderBy(desc(recordings.createdAt));
    
    return results.map(r => ({ ...r.recording, user: r.user }));
  }

  async getAllRecordings(): Promise<(Recording & { user: User | null })[]> {
    const results = await db
      .select({
        recording: recordings,
        user: users,
      })
      .from(recordings)
      .leftJoin(users, eq(recordings.userId, users.id))
      .orderBy(desc(recordings.createdAt));
    
    return results.map(r => ({ ...r.recording, user: r.user }));
  }

  async createFeedback(feedbackData: InsertFeedback): Promise<Feedback> {
    const [newFeedback] = await db
      .insert(feedback)
      .values(feedbackData)
      .returning();
    
    // Update recording status to reviewed
    await db
      .update(recordings)
      .set({ status: "reviewed" })
      .where(eq(recordings.id, feedbackData.recordingId));

    return newFeedback;
  }

  async getFeedbackForRecording(recordingId: number): Promise<Feedback[]> {
    return db
      .select()
      .from(feedback)
      .where(eq(feedback.recordingId, recordingId))
      .orderBy(desc(feedback.createdAt));
  }
}

export const storage = new DatabaseStorage();
