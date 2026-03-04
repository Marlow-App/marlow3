import { pgTable, text, serial, timestamp, boolean, integer, varchar, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";
import { users } from "./models/auth";

export * from "./models/auth";

export const recordings = pgTable("recordings", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  audioUrl: text("audio_url").notNull(),
  sentenceText: text("sentence_text").notNull(),
  status: text("status", { enum: ["pending", "reviewed"] }).default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const characterRatingSchema = z.object({
  character: z.string(),
  initial: z.number().refine(v => [0, 50, 100].includes(v)),
  final: z.number().refine(v => [0, 50, 100].includes(v)),
  tone: z.number().refine(v => [0, 50, 100].includes(v)),
});

export type CharacterRating = z.infer<typeof characterRatingSchema>;

export const feedback = pgTable("feedback", {
  id: serial("id").primaryKey(),
  recordingId: integer("recording_id").notNull().references(() => recordings.id),
  reviewerId: varchar("reviewer_id").notNull().references(() => users.id),
  textFeedback: text("text_feedback").notNull(),
  corrections: text("corrections"),
  audioFeedbackUrl: text("audio_feedback_url"),
  rating: integer("rating"),
  characterRatings: jsonb("character_ratings"),
  overallScore: integer("overall_score"),
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

// Schemas
export const insertRecordingSchema = createInsertSchema(recordings).omit({ 
  id: true, 
  userId: true, 
  status: true, 
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
