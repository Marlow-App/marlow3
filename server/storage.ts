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
import { ObjectStorageService, objectStorageClient } from "./replit_integrations/object_storage";

export interface IStorage {
  createRecording(userId: string, recording: InsertRecording): Promise<Recording>;
  getRecording(id: number): Promise<Recording | undefined>;
  getRecordingsByUser(userId: string): Promise<Recording[]>;
  getAllPendingRecordings(): Promise<(Recording & { user: User | null })[]>;
  getAllRecordings(): Promise<(Recording & { user: User | null })[]>;
  deleteRecording(id: number): Promise<boolean>;
  createFeedback(feedbackData: InsertFeedback): Promise<Feedback>;
  getFeedback(id: number): Promise<Feedback | undefined>;
  updateFeedback(id: number, data: Partial<InsertFeedback>): Promise<Feedback | undefined>;
  deleteFeedback(id: number): Promise<boolean>;
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

  async deleteRecording(id: number): Promise<boolean> {
    const [recording] = await db
      .select()
      .from(recordings)
      .where(eq(recordings.id, id));

    if (!recording) return false;

    const feedbackRows = await db
      .select()
      .from(feedback)
      .where(eq(feedback.recordingId, id));

    await db.delete(feedback).where(eq(feedback.recordingId, id));
    await db.delete(recordings).where(eq(recordings.id, id));

    const objService = new ObjectStorageService();

    for (const fb of feedbackRows) {
      if (fb.audioFeedbackUrl) {
        try {
          const file = await objService.getObjectEntityFile(fb.audioFeedbackUrl);
          await file.delete();
        } catch (e) {
          console.error(`Failed to delete feedback audio file ${fb.audioFeedbackUrl}:`, e);
        }
      }
    }

    if (recording.audioUrl) {
      try {
        const file = await objService.getObjectEntityFile(recording.audioUrl);
        await file.delete();
      } catch (e) {
        console.error(`Failed to delete recording audio file ${recording.audioUrl}:`, e);
      }
    }

    return true;
  }

  async createFeedback(feedbackData: InsertFeedback): Promise<Feedback> {
    const [newFeedback] = await db
      .insert(feedback)
      .values({
        recordingId: feedbackData.recordingId,
        reviewerId: (feedbackData as any).reviewerId,
        textFeedback: feedbackData.textFeedback,
        corrections: (feedbackData as any).corrections ?? null,
        audioFeedbackUrl: feedbackData.audioFeedbackUrl,
        rating: (feedbackData as any).rating ?? null,
        characterRatings: (feedbackData as any).characterRatings ?? null,
        overallScore: (feedbackData as any).overallScore ?? null,
      })
      .returning();
    
    // Update recording status to reviewed
    await db
      .update(recordings)
      .set({ status: "reviewed" })
      .where(eq(recordings.id, feedbackData.recordingId));

    return newFeedback;
  }

  async getFeedback(id: number): Promise<Feedback | undefined> {
    const [fb] = await db
      .select()
      .from(feedback)
      .where(eq(feedback.id, id));
    return fb;
  }

  async updateFeedback(id: number, data: Partial<InsertFeedback>): Promise<Feedback | undefined> {
    const updateData: any = {};
    if (data.textFeedback !== undefined) updateData.textFeedback = data.textFeedback;
    if ((data as any).corrections !== undefined) updateData.corrections = (data as any).corrections;
    if (data.audioFeedbackUrl !== undefined) updateData.audioFeedbackUrl = data.audioFeedbackUrl;
    if ((data as any).characterRatings !== undefined) updateData.characterRatings = (data as any).characterRatings;
    if ((data as any).overallScore !== undefined) updateData.overallScore = (data as any).overallScore;

    const [updated] = await db
      .update(feedback)
      .set(updateData)
      .where(eq(feedback.id, id))
      .returning();
    return updated;
  }

  async deleteFeedback(id: number): Promise<boolean> {
    const [fb] = await db
      .select()
      .from(feedback)
      .where(eq(feedback.id, id));

    if (!fb) return false;

    if (fb.audioFeedbackUrl) {
      try {
        const objService = new ObjectStorageService();
        const file = await objService.getObjectEntityFile(fb.audioFeedbackUrl);
        await file.delete();
      } catch (e) {
        console.error(`Failed to delete feedback audio file ${fb.audioFeedbackUrl}:`, e);
      }
    }

    await db.delete(feedback).where(eq(feedback.id, id));

    const remaining = await db
      .select()
      .from(feedback)
      .where(eq(feedback.recordingId, fb.recordingId));

    if (remaining.length === 0) {
      await db
        .update(recordings)
        .set({ status: "pending" })
        .where(eq(recordings.id, fb.recordingId));
    }

    return true;
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
