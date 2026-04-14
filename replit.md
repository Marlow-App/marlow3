# Marlow — Mandarin Tone Trainer

## Overview

Marlow is a web application designed to help users learn Chinese tones. It facilitates this by allowing learners to record themselves speaking Chinese sentences and then receive detailed text and audio feedback from native speakers or AI. The platform supports two main user roles: Learners, who submit recordings, and Reviewers, who provide corrections. The project aims to provide an interactive and effective tool for Mandarin pronunciation practice, leveraging both human and AI-powered feedback mechanisms.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Overall Structure

The project employs a monorepo architecture, organized into three primary directories: `client/` for the React frontend, `server/` for the Express backend, and `shared/` for code shared between both.

### Frontend Architecture

The frontend is built with React and TypeScript, bundled by Vite, and uses `wouter` for routing. State management is handled by TanStack React Query. UI components are developed using shadcn/ui (based on Radix UI) and styled with Tailwind CSS, adhering to a "Chinese aesthetic" color palette (Imperial Red and Gold). Fonts include DM Sans and Nexa. Audio recording utilizes the browser's MediaRecorder API, and file uploads are managed by Uppy with presigned URLs to object storage. The `pinyin-pro` library generates tone-colored pinyin, and custom logic handles Mandarin tone sandhi rules.

Key pages include:
- `Landing`: Unauthenticated entry point.
- `Home`: User dashboard with daily challenges and recent recordings.
- `Record`: For submitting new audio recordings.
- `LearnerPortal`: View learner's recordings and feedback.
- `ReviewerPortal`: For reviewers to manage pending and completed feedback tasks.
- `RecordingDetail`: Detailed view of a recording with feedback options.
- `PracticeList`: A personalized list of saved errors for learners.
- `Crossword`: Daily Chinese mini crossword puzzle with pinyin input (NYT mini style), social sharing.
- `CrosswordEditor`: Admin/reviewer-only editor for puzzle clues, chars, and answers.
- `ConsentGate` & `Onboarding`: Initial setup for new users.
- `Profile`: User account management, including subscription and settings.

### Backend Architecture

The backend is an Express.js application written in TypeScript, providing a RESTful JSON API. Route definitions and validation schemas are shared via `shared/routes.ts`. Data persistence is managed through an `IStorage` interface implemented by `DatabaseStorage` using Drizzle ORM. Authentication is handled by Replit Auth (OpenID Connect) via Passport.js, with sessions stored in PostgreSQL. File storage leverages Replit Object Storage with presigned URLs.

### Database

PostgreSQL is the primary database, managed by Drizzle ORM and `drizzle-kit`. The schema defines `users`, `sessions`, `recordings`, `feedback`, `userConsents`, `dailyCrosswords`, and `crosswordCompletions` tables. The `users` table stores subscription-related fields. `dailyCrosswords` stores puzzle data (grid, words with answers) seeded from `server/crossword-seed.ts`. `crosswordCompletions` tracks per-user progress and completion status per puzzle per day.

### Daily Crossword

A daily 5×5 mini crossword puzzle. 14 puzzles cycle daily (by epoch day mod 14). Each puzzle has up to 5 Chinese vocabulary words. Users type pinyin per cell and click "Check Answers" for server-side validation (answers are never sent to the client). On completion, users see a celebration screen and can share an emoji grid on X, Threads, Facebook, WhatsApp, or clipboard. Seed data is in `server/crossword-seed.ts`; the editor at `/crossword/editor` is reviewer-only.

### Authentication

Replit Auth, an OpenID Connect provider, handles user authentication. Passport.js is used on the server, with session data stored in PostgreSQL. API routes are protected by an `isAuthenticated` middleware.

### Subscription Model

Marlow operates on a freemium model. The free tier has daily limits on recordings, error popup views, and practice list items. A Pro tier offers unlimited access for a monthly or yearly fee, managed via Stripe subscriptions. Server-side enforcement handles limits, while client-side logic tracks usage and displays upsell modals.

### SpeechSuper Auto-Review

Learner recordings are automatically scored using SpeechSuper's `sent.eval.cn` API, providing immediate per-character tone, initial, and final feedback. Audio is transcoded to WAV format server-side using ffmpeg. SpeechSuper scores are mapped to application-specific values, and tone/pronunciation errors are detected based on thresholds. This process runs asynchronously, and results are polled by the client. AI feedback is marked with `isAiFeedback` and can trigger credit refunds for high-scoring recordings.

### Email Notifications

Email notifications are sent via Resend (`noreply@marlow.app`). Triggers include feedback submission (notifying learners) and recording submission (notifying opted-in reviewers). Email preferences are controlled by the `emailNotifications` field on the `users` table. Email sending is fire-and-forget, with silent error handling.

### Stripe Integration

Stripe is integrated for payment processing and subscription management using the `stripe` and `stripe-replit-sync` packages. Webhooks handle subscription lifecycle events, updating user subscription status in the database. Dedicated API routes exist for initiating subscriptions, accessing the billing portal, and retrieving the publishable key.

## External Dependencies

-   **PostgreSQL Database**: Main data store for all application data.
-   **Replit Object Storage**: Used for storing audio recordings and feedback audio files.
-   **Replit Auth**: Primary authentication provider using OpenID Connect.
-   **Stripe**: Payment processing for subscriptions.
-   **SpeechSuper API**: For automated Mandarin tone and pronunciation scoring.
-   **Resend**: Email notification service.
-   **Key NPM Packages (Backend)**: `express`, `drizzle-orm`, `pg`, `passport`, `stripe`, `stripe-replit-sync`.
-   **Key NPM Packages (Frontend)**: `react`, `wouter`, `@tanstack/react-query`, `@radix-ui/*`, `tailwindcss`, `@uppy/core`, `@uppy/aws-s3`.
-   **Key NPM Packages (Shared)**: `zod`, `drizzle-zod`.