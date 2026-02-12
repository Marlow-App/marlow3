# SixTone Studio

## Overview

SixTone Studio is a web application for learning Chinese tones through voice recording and native speaker feedback. Learners record themselves speaking Chinese sentences, submit recordings for review, and receive text and audio feedback from native speakers/reviewers. The app has two main user roles: **Learners** (who record and receive feedback) and **Reviewers** (who listen to recordings and provide corrections).

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
- **Styling**: Tailwind CSS with CSS custom properties for theming. The theme uses a warm "Chinese aesthetic" palette with Imperial Red as primary and Gold as secondary. Fonts: DM Sans (body) and Playfair Display (display/headings)
- **File Uploads**: Uppy library with presigned URL flow (AWS S3-compatible via Replit Object Storage)
- **Audio Recording**: Browser-native MediaRecorder API via custom `AudioRecorder` component
- **Key Pages**:
  - `Landing` — unauthenticated landing page
  - `Home` — dashboard with greeting and recent recordings
  - `Record` — record audio with sentence text input
  - `LearnerPortal` — view your recordings and their feedback
  - `ReviewerPortal` — view all pending recordings awaiting review
  - `RecordingDetail` — view a specific recording with ability to leave feedback
  - `Profile` — user profile and account management

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
  - `users` — user accounts (required for Replit Auth)
  - `sessions` — session storage (required for Replit Auth)
  - `recordings` — audio recordings submitted by learners (fields: audioUrl, sentenceText, status pending/reviewed)
  - `feedback` — reviewer feedback on recordings (fields: textFeedback, audioFeedbackUrl, reviewerId)
- **Relations**: recordings belong to users, feedback belongs to recordings and reviewers
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

## External Dependencies

### Required Services

- **PostgreSQL Database** — Primary data store. Must be provisioned and `DATABASE_URL` environment variable set. Used for user data, sessions, recordings, and feedback.
- **Replit Object Storage** — File storage for audio recordings and feedback audio. Uses Google Cloud Storage SDK talking to Replit's sidecar at `http://127.0.0.1:1106`. Presigned URL upload flow.
- **Replit Auth (OpenID Connect)** — Authentication provider. Requires `REPL_ID`, `ISSUER_URL`, and `SESSION_SECRET` environment variables.

### Key NPM Dependencies

- **Backend**: express, drizzle-orm, pg, passport, express-session, connect-pg-simple, @google-cloud/storage, zod
- **Frontend**: react, wouter, @tanstack/react-query, @radix-ui/* (shadcn/ui), tailwindcss, @uppy/core, @uppy/aws-s3, date-fns, lucide-react, class-variance-authority
- **Shared**: drizzle-zod, zod