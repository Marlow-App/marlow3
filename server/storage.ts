import { db } from "./db";
import {
  recordings,
  feedback,
  users,
  userConsents,
  creditTransactions,
  pronunciationErrors,
  practiceListItems,
  type InsertRecording,
  type InsertFeedback,
  type InsertFeedbackWithReviewer,
  type Recording,
  type Feedback,
  type User,
  type CreditTransaction,
  type PronunciationError,
  type PracticeListItem,
} from "@shared/schema";
import { eq, desc, and, like, sql } from "drizzle-orm";
import { authStorage } from "./replit_integrations/auth/storage";
import { ObjectStorageService } from "./replit_integrations/object_storage";
import { SIGNUP_BONUS, DAILY_REWARD, MAX_FREE_BANK } from "@shared/credits";

export interface IStorage {
  createRecording(userId: string, recording: InsertRecording, creditCost?: number, parentRecordingId?: number): Promise<Recording>;
  createRecordingAndDeductCredits(userId: string, recording: InsertRecording, creditCost: number, parentRecordingId?: number): Promise<Recording>;
  getRecording(id: number): Promise<Recording | undefined>;
  getRecordingsByUser(userId: string): Promise<Recording[]>;
  getChildRecordings(parentId: number): Promise<Recording[]>;
  getAllPendingRecordings(): Promise<(Recording & { user: User | null })[]>;
  getAllRecordings(): Promise<(Recording & { user: User | null })[]>;
  deleteRecording(id: number): Promise<boolean>;
  createFeedback(feedbackData: InsertFeedbackWithReviewer): Promise<Feedback>;
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
  // Error methods
  getErrors(category?: string): Promise<PronunciationError[]>;
  getError(id: string): Promise<PronunciationError | undefined>;
  createError(data: { id: string; category: "tone" | "initial" | "final"; commonError: string; simpleExplanation?: string; howToFix?: string; practiceWords?: string[]; createdBy: string }): Promise<PronunciationError>;
  // Practice list methods
  getPracticeList(userId: string): Promise<(PracticeListItem & { error: PronunciationError; sentenceText?: string })[]>;
  addToPracticeList(userId: string, errorId: string, character?: string, recordingId?: number): Promise<PracticeListItem>;
  removeFromPracticeList(id: number, userId: string): Promise<boolean>;
  isPracticeListItem(userId: string, errorId: string): Promise<boolean>;
  getReviewersWithEmailNotifications(): Promise<User[]>;
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

  async createRecordingAndDeductCredits(userId: string, recording: InsertRecording, creditCost: number, parentRecordingId?: number): Promise<Recording> {
    return db.transaction(async (tx) => {
      const [newRecording] = await tx
        .insert(recordings)
        .values({ ...recording, userId, creditCost, ...(parentRecordingId ? { parentRecordingId } : {}) })
        .returning();

      if (creditCost > 0) {
        await tx.insert(creditTransactions).values({
          userId,
          type: "spend",
          amount: -creditCost,
          recordingId: newRecording.id,
        });

        const [currentUser] = await tx.select().from(users).where(eq(users.id, userId));
        const newTotal = (currentUser?.creditBalance ?? 0) - creditCost;
        const newFree = Math.max(0, (currentUser?.freeCreditsBalance ?? 0) - creditCost);
        await tx
          .update(users)
          .set({ creditBalance: newTotal, freeCreditsBalance: newFree, updatedAt: new Date() })
          .where(eq(users.id, userId));
      }

      return newRecording;
    });
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

  async getChildRecordings(parentId: number): Promise<Recording[]> {
    return db
      .select()
      .from(recordings)
      .where(eq(recordings.parentRecordingId, parentId))
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

  async createFeedback(feedbackData: InsertFeedbackWithReviewer): Promise<Feedback> {
    const [newFeedback] = await db
      .insert(feedback)
      .values({
        recordingId: feedbackData.recordingId,
        reviewerId: feedbackData.reviewerId,
        textFeedback: feedbackData.textFeedback,
        corrections: feedbackData.corrections ?? null,
        audioFeedbackUrl: feedbackData.audioFeedbackUrl,
        rating: feedbackData.rating ?? null,
        characterRatings: feedbackData.characterRatings ?? null,
        fluencyScore: feedbackData.fluencyScore ?? null,
        overallScore: feedbackData.overallScore ?? null,
        speechSuperScores: (feedbackData as any).speechSuperScores ?? null,
        isAiFeedback: feedbackData.isAiFeedback ?? false,
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

  // ─── Error Methods ─────────────────────────────────────────────────────────

  async getErrors(category?: string): Promise<PronunciationError[]> {
    if (category) {
      return db
        .select()
        .from(pronunciationErrors)
        .where(eq(pronunciationErrors.category, category as "tone" | "initial" | "final"))
        .orderBy(pronunciationErrors.id);
    }
    return db.select().from(pronunciationErrors).orderBy(pronunciationErrors.id);
  }

  async getError(id: string): Promise<PronunciationError | undefined> {
    const [err] = await db
      .select()
      .from(pronunciationErrors)
      .where(eq(pronunciationErrors.id, id));
    return err;
  }

  async createError(data: {
    id: string;
    category: "tone" | "initial" | "final";
    commonError: string;
    simpleExplanation?: string;
    howToFix?: string;
    practiceWords?: string[];
    createdBy: string;
  }): Promise<PronunciationError> {
    const [created] = await db
      .insert(pronunciationErrors)
      .values({
        id: data.id,
        category: data.category,
        commonError: data.commonError,
        simpleExplanation: data.simpleExplanation ?? null,
        howToFix: data.howToFix ?? null,
        practiceWords: data.practiceWords ?? [],
        isCustom: true,
        createdBy: data.createdBy,
      })
      .returning();
    return created;
  }

  // ─── Practice List ─────────────────────────────────────────────────────────

  async getPracticeList(userId: string): Promise<(PracticeListItem & { error: PronunciationError; sentenceText?: string })[]> {
    const rows = await db
      .select({ item: practiceListItems, error: pronunciationErrors, sentenceText: recordings.sentenceText })
      .from(practiceListItems)
      .innerJoin(pronunciationErrors, eq(practiceListItems.errorId, pronunciationErrors.id))
      .leftJoin(recordings, eq(practiceListItems.recordingId, recordings.id))
      .where(eq(practiceListItems.userId, userId))
      .orderBy(desc(practiceListItems.addedAt));
    return rows.map(r => ({ ...r.item, error: r.error, sentenceText: r.sentenceText ?? undefined }));
  }

  async addToPracticeList(userId: string, errorId: string, character?: string, recordingId?: number): Promise<PracticeListItem> {
    // Upsert: if same userId+errorId+character exists, return it
    const existing = await db
      .select()
      .from(practiceListItems)
      .where(
        and(
          eq(practiceListItems.userId, userId),
          eq(practiceListItems.errorId, errorId),
          character ? eq(practiceListItems.character, character) : sql`character IS NULL`
        )
      )
      .limit(1);
    if (existing.length > 0) {
      if (recordingId && !existing[0].recordingId) {
        const [updated] = await db
          .update(practiceListItems)
          .set({ recordingId })
          .where(eq(practiceListItems.id, existing[0].id))
          .returning();
        return updated;
      }
      return existing[0];
    }

    const [item] = await db
      .insert(practiceListItems)
      .values({ userId, errorId, character: character ?? null, recordingId: recordingId ?? null })
      .returning();
    return item;
  }

  async removeFromPracticeList(id: number, userId: string): Promise<boolean> {
    const result = await db
      .delete(practiceListItems)
      .where(and(eq(practiceListItems.id, id), eq(practiceListItems.userId, userId)))
      .returning();
    return result.length > 0;
  }

  async isPracticeListItem(userId: string, errorId: string): Promise<boolean> {
    const rows = await db
      .select()
      .from(practiceListItems)
      .where(and(eq(practiceListItems.userId, userId), eq(practiceListItems.errorId, errorId)))
      .limit(1);
    return rows.length > 0;
  }

  async getReviewersWithEmailNotifications(): Promise<User[]> {
    return db
      .select()
      .from(users)
      .where(
        and(
          eq(users.role, "reviewer"),
          eq(users.emailNotifications, true),
          sql`${users.email} IS NOT NULL`
        )
      );
  }
}

export const storage = new DatabaseStorage();
