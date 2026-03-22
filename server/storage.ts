import { db } from "./db";
import {
  recordings,
  feedback,
  users,
  userConsents,
  creditTransactions,
  type InsertRecording,
  type InsertFeedback,
  type Recording,
  type Feedback,
  type User,
  type CreditTransaction
} from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";
import { authStorage } from "./replit_integrations/auth/storage";
import { ObjectStorageService } from "./replit_integrations/object_storage";
import { SIGNUP_BONUS, DAILY_REWARD, MAX_FREE_BANK } from "@shared/credits";

export interface IStorage {
  createRecording(userId: string, recording: InsertRecording, creditCost?: number, parentRecordingId?: number): Promise<Recording>;
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
  // Credit methods
  grantSignupBonus(userId: string): Promise<void>;
  grantDailyReward(userId: string): Promise<boolean>;
  addCredits(userId: string, amount: number, stripeSessionId: string): Promise<void>;
  spendCredits(userId: string, recordingId: number, amount: number): Promise<void>;
  refundCredits(recordingId: number): Promise<void>;
  getCreditTransactions(userId: string): Promise<CreditTransaction[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    return authStorage.getUser(id);
  }

  async createRecording(userId: string, recording: InsertRecording, creditCost = 0, parentRecordingId?: number): Promise<Recording> {
    const [newRecording] = await db
      .insert(recordings)
      .values({ ...recording, userId, creditCost, ...(parentRecordingId ? { parentRecordingId } : {}) })
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
    await db.delete(creditTransactions).where(eq(creditTransactions.recordingId, id));
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
        fluencyScore: (feedbackData as any).fluencyScore ?? null,
        overallScore: (feedbackData as any).overallScore ?? null,
      })
      .returning();
    
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
    if ((data as any).fluencyScore !== undefined) updateData.fluencyScore = (data as any).fluencyScore;
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

  // ─── Credit Methods ───────────────────────────────────────────────────────

  async grantSignupBonus(userId: string): Promise<void> {
    const existing = await db
      .select()
      .from(creditTransactions)
      .where(and(
        eq(creditTransactions.userId, userId),
        eq(creditTransactions.type, "signup_bonus")
      ));
    if (existing.length > 0) return;

    await db.insert(creditTransactions).values({
      userId,
      type: "signup_bonus",
      amount: SIGNUP_BONUS,
    });

    const user = await this.getUser(userId);
    await authStorage.upsertUser({
      id: userId,
      creditBalance: (user?.creditBalance ?? 0) + SIGNUP_BONUS,
      freeCreditsBalance: (user?.freeCreditsBalance ?? 0) + SIGNUP_BONUS,
    });
  }

  async grantDailyReward(userId: string): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user) return false;

    const freeBalance = user.freeCreditsBalance ?? 0;
    if (freeBalance >= MAX_FREE_BANK) return false;

    const nowUtc = new Date();
    const todayUtc = new Date(Date.UTC(nowUtc.getUTCFullYear(), nowUtc.getUTCMonth(), nowUtc.getUTCDate()));

    if (user.lastDailyRewardAt) {
      const lastDate = new Date(user.lastDailyRewardAt);
      const lastUtc = new Date(Date.UTC(lastDate.getUTCFullYear(), lastDate.getUTCMonth(), lastDate.getUTCDate()));
      if (lastUtc >= todayUtc) return false;
    }

    await db.insert(creditTransactions).values({
      userId,
      type: "daily_reward",
      amount: DAILY_REWARD,
    });

    await authStorage.upsertUser({
      id: userId,
      creditBalance: (user.creditBalance ?? 0) + DAILY_REWARD,
      freeCreditsBalance: freeBalance + DAILY_REWARD,
      lastDailyRewardAt: nowUtc,
    });

    return true;
  }

  async addCredits(userId: string, amount: number, stripeSessionId: string): Promise<void> {
    const existing = await db
      .select()
      .from(creditTransactions)
      .where(eq(creditTransactions.stripeSessionId, stripeSessionId));
    if (existing.length > 0) return;

    await db.insert(creditTransactions).values({
      userId,
      type: "purchase",
      amount,
      stripeSessionId,
    });

    const user = await this.getUser(userId);
    await authStorage.upsertUser({
      id: userId,
      creditBalance: (user?.creditBalance ?? 0) + amount,
    });
  }

  async spendCredits(userId: string, recordingId: number, amount: number): Promise<void> {
    if (amount <= 0) return;

    await db.insert(creditTransactions).values({
      userId,
      type: "spend",
      amount: -amount,
      recordingId,
    });

    const user = await this.getUser(userId);
    const newTotal = (user?.creditBalance ?? 0) - amount;
    const newFree = Math.max(0, (user?.freeCreditsBalance ?? 0) - amount);
    await authStorage.upsertUser({
      id: userId,
      creditBalance: newTotal,
      freeCreditsBalance: newFree,
    });
  }

  async refundCredits(recordingId: number): Promise<void> {
    const [recording] = await db
      .select()
      .from(recordings)
      .where(eq(recordings.id, recordingId));

    if (!recording || recording.creditsRefunded || recording.creditCost <= 0) return;

    const amount = recording.creditCost;
    const userId = recording.userId;

    await db.insert(creditTransactions).values({
      userId,
      type: "refund",
      amount,
      recordingId,
    });

    await db
      .update(recordings)
      .set({ creditsRefunded: true })
      .where(eq(recordings.id, recordingId));

    const user = await this.getUser(userId);
    await authStorage.upsertUser({
      id: userId,
      creditBalance: (user?.creditBalance ?? 0) + amount,
    });
  }

  async getCreditTransactions(userId: string): Promise<CreditTransaction[]> {
    return db
      .select()
      .from(creditTransactions)
      .where(eq(creditTransactions.userId, userId))
      .orderBy(desc(creditTransactions.createdAt));
  }
}

export const storage = new DatabaseStorage();
