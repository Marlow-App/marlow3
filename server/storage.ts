import { db } from "./db";
import {
  recordings,
  feedback,
  users,
  userConsents,
  type InsertRecording,
  type InsertFeedback,
  type Recording,
  type Feedback,
  type User
} from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";
import { authStorage } from "./replit_integrations/auth/storage";

export interface IStorage {
  createRecording(userId: string, recording: InsertRecording): Promise<Recording>;
  getRecording(id: number): Promise<Recording | undefined>;
  getRecordingsByUser(userId: string): Promise<Recording[]>;
  getAllPendingRecordings(): Promise<(Recording & { user: User | null })[]>;
  getAllRecordings(): Promise<(Recording & { user: User | null })[]>;
  createFeedback(feedbackData: InsertFeedback): Promise<Feedback>;
  getFeedbackForRecording(recordingId: number): Promise<Feedback[]>;
  getUser(id: string): Promise<User | undefined>;
  saveConsents(userId: string, consentTypes: string[], policyVersion: string, ipAddress: string): Promise<void>;
  hasUserConsented(userId: string): Promise<boolean>;
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
      .values({
        recordingId: feedbackData.recordingId,
        reviewerId: (feedbackData as any).reviewerId,
        textFeedback: feedbackData.textFeedback,
        audioFeedbackUrl: feedbackData.audioFeedbackUrl,
        rating: (feedbackData as any).rating ?? null,
      })
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

  async saveConsents(userId: string, consentTypes: string[], policyVersion: string, ipAddress: string): Promise<void> {
    const values = consentTypes.map(type => ({
      userId,
      consentType: type,
      policyVersion,
      ipAddress,
    }));
    await db.insert(userConsents).values(values);
    await authStorage.upsertUser({ id: userId, consentGiven: true });
  }

  async hasUserConsented(userId: string): Promise<boolean> {
    const user = await this.getUser(userId);
    return !!user?.consentGiven;
  }
}

export const storage = new DatabaseStorage();
