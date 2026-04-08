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
  initial: z.number().min(0).max(100),
  final: z.number().min(0).max(100),
  tone: z.number().min(0).max(100),
  initialError: z.string().optional(),
  finalError: z.string().optional(),
  toneError: z.string().optional(),
  // SpeechSuper fields — only populated on AI feedback, optional for backward compat
  detectedTone: z.number().int().min(1).max(5).optional(),   // tone SpeechSuper detected (1-5)
  expectedTone: z.number().int().min(1).max(5).optional(),   // tone the character should be (1-5)
  toneScoreRaw: z.number().min(0).max(100).optional(),       // SpeechSuper 0-100 tone accuracy score
  phoneScoreRaw: z.number().min(0).max(100).optional(),      // SpeechSuper 0-100 consonant+vowel quality
  initialScoreRaw: z.number().min(0).max(100).optional(),    // SpeechSuper 0-100 initial consonant accuracy
  finalScoreRaw: z.number().min(0).max(100).optional(),      // SpeechSuper 0-100 final (rhyme) accuracy
  initialSymbol: z.string().optional(),                      // initial phone symbol from SpeechSuper (e.g. "zh")
  finalSymbol: z.string().optional(),                        // final phone symbol from SpeechSuper (e.g. "eng")
  hasInitial: z.boolean().optional(),                        // true if character has an initial consonant
});

export const speechSuperScoresSchema = z.object({
  tone: z.number().optional(),         // sentence-level tone accuracy (0-100)
  rearTone: z.number().optional(),     // rear tone / sandhi context (0-100)
  rhythm: z.number().optional(),       // rhythm / intonation flow (0-100)
  speed: z.number().optional(),        // speaking pace (0-100)
  pronunciation: z.number().optional(), // overall phoneme accuracy (0-100)
});

export type SpeechSuperScores = z.infer<typeof speechSuperScoresSchema>;

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
  speechSuperScores: jsonb("speech_super_scores"),
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

export const supportTickets = pgTable("support_tickets", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  category: text("category").notNull(),
  message: text("message").notNull(),
  status: text("status", { enum: ["open", "completed"] }).default("open").notNull(),
  resolvedById: varchar("resolved_by_id").references(() => users.id),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type SupportTicket = typeof supportTickets.$inferSelect;
export const insertSupportTicketSchema = createInsertSchema(supportTickets).omit({ id: true, userId: true, status: true, resolvedById: true, resolvedAt: true, createdAt: true });
export type InsertSupportTicket = z.infer<typeof insertSupportTicketSchema>;

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
export type InsertFeedbackWithReviewer = InsertFeedback & { reviewerId: string; isAiFeedback?: boolean };
export type CreditTransaction = typeof creditTransactions.$inferSelect;
