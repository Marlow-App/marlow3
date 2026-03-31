import { pgTable, text, serial, timestamp, boolean, integer, varchar, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";
import { users } from "./models/auth";

export const pronunciationErrors = pgTable("pronunciation_errors", {
  id: text("id").primaryKey(),
  category: text("category", { enum: ["tone", "initial", "final"] }).notNull(),
  commonError: text("common_error").notNull(),
  example: text("example"),
  scientificExplanation: text("scientific_explanation"),
  simpleExplanation: text("simple_explanation"),
  howToFix: text("how_to_fix"),
  minimalPairs: text("minimal_pairs"),
  practiceWords: text("practice_words").array(),
  isCustom: boolean("is_custom").default(false).notNull(),
  createdBy: varchar("created_by").references(() => users.id),
});

export * from "./models/auth";

export const recordings = pgTable("recordings", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  audioUrl: text("audio_url").notNull(),
  sentenceText: text("sentence_text").notNull(),
  status: text("status", { enum: ["pending", "reviewed"] }).default("pending").notNull(),
  creditCost: integer("credit_cost").default(0).notNull(),
  creditsRefunded: boolean("credits_refunded").default(false).notNull(),
  parentRecordingId: integer("parent_recording_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const characterRatingSchema = z.object({
  character: z.string(),
  initial: z.number().refine(v => [0, 50, 100].includes(v)),
  final: z.number().refine(v => [0, 50, 100].includes(v)),
  tone: z.number().refine(v => [0, 50, 100].includes(v)),
  initialError: z.string().optional(),
  finalError: z.string().optional(),
  toneError: z.string().optional(),
});

export type CharacterRating = z.infer<typeof characterRatingSchema>;
export type PronunciationError = typeof pronunciationErrors.$inferSelect;
export const insertPronunciationErrorSchema = createInsertSchema(pronunciationErrors).omit({ isCustom: true, createdBy: true });
export type InsertPronunciationError = z.infer<typeof insertPronunciationErrorSchema>;

export const feedback = pgTable("feedback", {
  id: serial("id").primaryKey(),
  recordingId: integer("recording_id").notNull().references(() => recordings.id),
  reviewerId: varchar("reviewer_id").notNull().references(() => users.id),
  textFeedback: text("text_feedback").notNull(),
  corrections: text("corrections"),
  audioFeedbackUrl: text("audio_feedback_url"),
  rating: integer("rating"),
  characterRatings: jsonb("character_ratings"),
  fluencyScore: integer("fluency_score"),
  overallScore: integer("overall_score"),
  isAiFeedback: boolean("is_ai_feedback").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const practiceListItems = pgTable("practice_list_items", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  errorId: text("error_id").notNull().references(() => pronunciationErrors.id),
  character: text("character"),
  recordingId: integer("recording_id").references(() => recordings.id),
  addedAt: timestamp("added_at").defaultNow().notNull(),
});

export type PracticeListItem = typeof practiceListItems.$inferSelect;

export const creditTransactions = pgTable("credit_transactions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: text("type", { enum: ["signup_bonus", "daily_reward", "purchase", "spend", "refund"] }).notNull(),
  amount: integer("amount").notNull(),
  recordingId: integer("recording_id"),
  stripeSessionId: text("stripe_session_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const recordingsRelations = relations(recordings, ({ one, many }) => ({
  user: one(users, {
    fields: [recordings.userId],
    references: [users.id],
  }),
  feedback: many(feedback),
}));

export const feedbackRelations = relations(feedback, ({ one }) => ({
  recording: one(recordings, {
    fields: [feedback.recordingId],
    references: [recordings.id],
  }),
  reviewer: one(users, {
    fields: [feedback.reviewerId],
    references: [users.id],
  }),
}));

export const creditTransactionsRelations = relations(creditTransactions, ({ one }) => ({
  user: one(users, {
    fields: [creditTransactions.userId],
    references: [users.id],
  }),
}));

// Schemas
export const insertRecordingSchema = createInsertSchema(recordings).omit({ 
  id: true, 
  userId: true, 
  status: true,
  creditCost: true,
  creditsRefunded: true,
  parentRecordingId: true,
  createdAt: true 
});

export const insertFeedbackSchema = createInsertSchema(feedback).omit({ 
  id: true, 
  reviewerId: true, 
  createdAt: true 
});

// Types
export type Recording = typeof recordings.$inferSelect;
export type InsertRecording = z.infer<typeof insertRecordingSchema>;
export type Feedback = typeof feedback.$inferSelect;
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;
export type CreditTransaction = typeof creditTransactions.$inferSelect;
