# Marlow — Mandarin Tone Trainer

## Overview

Marlow is a web application for learning Chinese tones through voice recording and native speaker feedback. Learners record themselves speaking Chinese sentences, submit recordings for review, and receive text and audio feedback from native speakers/reviewers. The app has two main user roles: **Learners** (who record and receive feedback) and **Reviewers** (who listen to recordings and provide corrections).

## Credit System

Marlow uses a credit-based (pay-as-you-go) model instead of subscriptions:
- **1 credit = 1 Chinese character** recorded (max 10 chars per session)
- **Signup bonus**: 10 credits granted on first onboarding completion
- **Daily reward**: +1 free credit/day (fire-and-forget on balance fetch), max 3 banked
- **Refund**: Score ≥ 95% → credits automatically refunded
- **Packs**: $5→15, $10→35, $20→75 (Most Popular), $50→200 (Best Value), $100→425
- **Unlimited bypass**: `jujusees@gmail.com` has unlimited credits (no deduction)
- **Stripe**: One-time `payment` mode checkout with `price_data` and `metadata: {userId, credits}`
- **Constants** in `shared/credits.ts`: `CREDIT_PACKS`, `MAX_CHARS=10`, `REFUND_THRESHOLD=95`, `SIGNUP_BONUS=10`, `DAILY_REWARD=1`, `MAX_FREE_BANK=3`

## iFLYTEK ISE Auto-Review

- **Purpose**: Automatically score learner recordings using iFLYTEK's Pronunciation Assessment (ISE) API, giving instant feedback seconds after upload
- **Endpoint**: `ws://ise-api-sg.xf-yun.com/v2/ise` — same HMAC-SHA256 auth as TTS, credentials: `IFLYTEK_APP_ID`, `IFLYTEK_API_KEY`, `IFLYTEK_API_SECRET`
- **ISE params**: `ent:"cn_vip"`, `category:"read_sentence"`, `aue:"raw"` (PCM), `extra_ability:"syll_phone_err_msg|tone"`, `plev:"0"`; text requires UTF-8 BOM (`\uFEFF`)
- **Transcoding**: Browser recordings (webm/mp4) are transcoded server-side via ffmpeg to 16kHz 16-bit mono signed PCM before streaming to ISE (`aue:"raw"`). ffmpeg is available at runtime in the Replit NixOS environment.
- **Audio streaming**: 1280-byte chunks at 40ms intervals over WebSocket
- **Score mapping**: iFLYTEK 0-100 → app 0/50/100: <40→0, <75→50, ≥75→100. Fluency 0-100 → 1-5 in 20-pt bands
- **Per-character tone scoring**: Uses `mono_tone` (e.g., `"TONE3"`) on each vowel phone compared against the expected tone from the syll's `symbol` attribute (e.g., `"mai3"` → TONE3). Match → tone great (100), mismatch → tone poor (0). Neutral tone syllables (tone 5) are always treated as correct. Falls back to syll `dp_message` if either attribute is absent.
- **Per-character initial/final scoring**: Uses `perr_msg` (error code) + `perr_level_msg` (severity 0-3) on each phone. `perr_msg=0` → no error (great). Non-zero `perr_msg` + severity 0/1 → ok (60), severity 2 → poor (30), severity 3 → poor (10).
- **Overall score**: Uses iFlytek's `total_score` from the inner `<read_sentence>` element (inside `<rec_paper>`), rounded to integer.
- **XML structure**: `<xml_result> → <read_sentence> → <rec_paper> → <read_sentence total_score="..." phone_score="..." tone_score="..."> → <sentence> → <word symbol="..."> → <syll symbol="mai3"> → <phone is_yun="0|1" mono_tone="TONE3" perr_msg="..." perr_level_msg="...">`
- **Asynchronous**: ISE runs fire-and-forget after the recording is created — the POST endpoint responds immediately with the new recording, and the client's `RecordingFeedback` polling component (2 s interval, 10 s timeout) picks up the results. ISE failures are caught silently so recording creation always succeeds regardless.
- **System user**: `"iflytek-ai"` upserted on server startup (firstName: "AI Review", role: "reviewer") satisfies FK on feedback.reviewerId
- **`isAiFeedback` field**: boolean on `feedback` table (default false); used in UI to show Bot icon + "AI Review" badge instead of reviewer name
- **Credit refund**: 95%+ score from ISE auto-review also triggers credit refund
- **Client module**: `server/iflytek-ise.ts` exports `scoreMandarin(audioUrl, sentenceText): Promise<ISEResult>`

## Email Notifications

- **Provider**: Resend (`resend` npm package) — requires `RESEND_API_KEY` secret
- **From address**: `noreply@marlow.app` (must be a Resend-verified sender domain)
- **Triggers**: feedback submitted → email learner; recording submitted → email all opted-in reviewers
- **Toggle**: `emailNotifications` boolean on users table (default false); controlled via Profile → Settings tab
- **Fire-and-forget**: email failures are caught/logged silently and never block API responses
- **No email graceful skip**: if user has no email address or key is unset, silently skipped
- **Helper functions**: `server/email.ts` exports `sendFeedbackNotification(learner, recording)` and `sendRecordingNotification(reviewer, recording, learner)`

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Overall Structure

The project uses a monorepo layout with three main directories:

- **`client/`** — React frontend (single-page app)
- **`server/`** — Express backend (REST API)
- **`shared/`** — Code shared between client and server (database schema, route definitions, types)

### Frontend Architecture

- **Framework**: React with TypeScript, bundled by Vite
- **Routing**: `wouter` (lightweight client-side router)
- **State Management**: TanStack React Query for server state (fetching, caching, mutations)
- **UI Components**: shadcn/ui component library built on Radix UI primitives, styled with Tailwind CSS
- **Styling**: Tailwind CSS with CSS custom properties for theming. The theme uses a warm "Chinese aesthetic" palette with Imperial Red as primary and Gold as secondary. Fonts: DM Sans (body) and Nexa (display/headings, loaded via FontShare CDN)
- **File Uploads**: Uppy library with presigned URL flow (AWS S3-compatible via Replit Object Storage)
- **Audio Recording**: Browser-native MediaRecorder API via custom `AudioRecorder` component with microphone selector dropdown (persisted in localStorage)
- **Pinyin**: `pinyin-pro` library generates pinyin for learner views on RecordingDetail (sentence header + character rating breakdown); tone-colored display
- **Tone Sandhi**: `client/src/lib/toneSandhi.ts` implements T3 sandhi (word-aware via dictionary-based segmentation), 不 sandhi (bù→bú before T4), and 一 sandhi (yī→yí before T4, yī→yì before T1/T2/T3) with neutral-tone underlying-tone resolution. `SandhiPhraseDisplay` component shows "Original" and "As spoken" rows side by side. Phrases in `phrases.ts` store canonical/dictionary tones (一=T1/yī, 不=T4/bù); sandhi is computed at render time.
- **Daily Challenge**: Level-based daily phrase on Home page; `getDailyChallenge(level)` in `client/src/data/phrases.ts` uses date-seeded selection; defaults to "Beginner" when user has no chineseLevel set
- **Phrase Bank**: 400 phrases total (100 per level) stored in compact format `{ words, english, level }` where `words` is space-separated tokens. `toToneChars(words)` computes `ToneChar[]` at runtime using `pinyin-pro` for context-aware tone detection. `PhraseLevel` = `"Absolute Beginner" | "Beginner" | "Intermediate" | "Difficult"` (note: user.chineseLevel still uses "Advanced")
- **Key Pages**:
  - `Landing` — unauthenticated landing page
  - `Home` — dashboard with greeting, daily challenge, and recent recordings
  - `Record` — record audio with sentence text input; supports `?phrase=` URL param for pre-selection; shows credit balance pill + cost preview (1 credit/char); 95%+ refund note
  - `LearnerPortal` — view your recordings and their feedback
  - `ReviewerPortal` — view pending recordings with Waiting/Completed tabs + sort toggle
  - `RecordingDetail` — view a specific recording with ability to leave feedback; reviewers can edit and delete their own feedback inline
  - `CheckoutSuccess` — post-payment confirmation page shown after Stripe checkout (shows credits added)
  - `PracticeList` — learner's saved error list; grouped by category (tone/initial/final); shows character with pinyin + TTS, expandable error detail, remove button
  - `PrivacyPolicy` — privacy policy page (accessible to all users)
  - `TermsOfService` — terms of service page (accessible to all users)
  - `ConsentGate` — consent screen shown to new users after login (age, terms, privacy, voice data)
  - `Onboarding` — 3-step onboarding wizard shown after consent for learners (Chinese level, native language, focus areas)
  - `Profile` — user profile and account management; learners get 3 tabs: Profile | Settings | Credits; reviewers get 2: Profile | Settings

### Backend Architecture

- **Framework**: Express.js with TypeScript, run via `tsx`
- **API Pattern**: RESTful JSON API under `/api/` prefix
- **Route Definitions**: Shared route manifest in `shared/routes.ts` with Zod schemas for validation
- **Storage Layer**: `IStorage` interface in `server/storage.ts` implemented by `DatabaseStorage` class using Drizzle ORM
- **Authentication**: Replit Auth (OpenID Connect) via Passport.js, with session storage in PostgreSQL (`connect-pg-simple`)
- **File Storage**: Replit Object Storage (Google Cloud Storage compatible) with presigned URL upload flow
- **Build**: Custom build script (`script/build.ts`) using Vite for client and esbuild for server, outputting to `dist/`

### Database

- **Database**: PostgreSQL (required, via `DATABASE_URL` environment variable)
- **ORM**: Drizzle ORM with `drizzle-kit` for schema management
- **Schema** (in `shared/schema.ts` and `shared/models/auth.ts`):
  - `users` — user accounts (required for Replit Auth); includes `focusAreas` (text[]), `nativeLanguage` (text), `onboardingComplete` (boolean, default false)
  - `sessions` — session storage (required for Replit Auth)
  - `recordings` — audio recordings submitted by learners (fields: audioUrl, sentenceText, status pending/reviewed, parentRecordingId nullable FK for re-records)
  - `feedback` — reviewer feedback on recordings (fields: textFeedback, corrections, audioFeedbackUrl, rating (legacy 1-3), characterRatings (JSONB per-character ratings), fluencyScore (integer 1-5, nullable), overallScore (computed percentage 0-100: 80% character + 20% fluency when fluency present), reviewerId)
  - `userConsents` — consent records (consentType, policyVersion, ipAddress, consentedAt)
- **Relations**: recordings belong to users, feedback belongs to recordings and reviewers, userConsents belong to users
- **Schema Push**: Use `npm run db:push` (runs `drizzle-kit push`) to sync schema to database

### Authentication

- Replit Auth using OpenID Connect protocol
- Implemented in `server/replit_integrations/auth/`
- Sessions stored in PostgreSQL via `connect-pg-simple`
- `isAuthenticated` middleware protects API routes
- Frontend checks auth state via `/api/auth/user` endpoint
- Login redirects to `/api/login`, logout to `/api/logout`

### Key Development Commands

- `npm run dev` — Start development server with hot reload
- `npm run build` — Build for production
- `npm run start` — Run production build
- `npm run db:push` — Push schema changes to database
- `npm run check` — TypeScript type checking

### Path Aliases

- `@/*` → `client/src/*`
- `@shared/*` → `shared/*`
- `@assets` → `attached_assets/`

### Stripe Integration

- **Payments**: Stripe integration via `stripe` and `stripe-replit-sync` packages (one-time payment mode only)
- **Stripe Files**: `server/stripe/stripeClient.ts` (client/sync), `server/stripe/webhookHandlers.ts`
- **Architecture**: Uses `stripe-replit-sync` for webhook sync. Credit purchases use `payment` mode with `price_data` (no pre-created products).
- **Webhook**: Registered BEFORE `express.json()` in `server/index.ts` at `/api/stripe/webhook`; handles `checkout.session.completed` (payment mode) to call `storage.addCredits()`
- **Routes**: `/api/stripe/checkout` (POST, accepts `{usd}` for pack selection), `/api/stripe/publishable-key`
- **User schema**: `stripeCustomerId` field on users table (stripeSubscriptionId kept for legacy but unused)

## External Dependencies

### Required Services

- **PostgreSQL Database** — Primary data store. Must be provisioned and `DATABASE_URL` environment variable set. Used for user data, sessions, recordings, and feedback.
- **Replit Object Storage** — File storage for audio recordings and feedback audio. Uses Google Cloud Storage SDK talking to Replit's sidecar at `http://127.0.0.1:1106`. Presigned URL upload flow.
- **Replit Auth (OpenID Connect)** — Authentication provider. Requires `REPL_ID`, `ISSUER_URL`, and `SESSION_SECRET` environment variables.
- **Stripe** — Payment processing via Replit Stripe connector. Credentials fetched from Replit connection API. Client falls back to development connection when production connection is unavailable.

### Key NPM Dependencies

- **Backend**: express, drizzle-orm, pg, passport, express-session, connect-pg-simple, @google-cloud/storage, zod, stripe, stripe-replit-sync
- **Frontend**: react, wouter, @tanstack/react-query, @radix-ui/* (shadcn/ui), tailwindcss, @uppy/core, @uppy/aws-s3, date-fns, lucide-react, class-variance-authority
- **Shared**: drizzle-zod, zod