# EatPlanManage

Group meal planning app — create sessions, vote on restaurants, set appointments, get notifications.

## Stack

- **Next.js 14** App Router + Server Components + Server Actions
- **Prisma** ORM + SQLite (swap `provider` to `postgresql` for prod)
- **NextAuth.js v5** — credentials + Google OAuth
- **Tailwind CSS** + shadcn/ui components
- **Sonner** toasts

## Setup

```bash
# 1. Install deps
npm install

# 2. Copy env
cp .env.example .env
# Edit .env — set NEXTAUTH_SECRET (run: openssl rand -base64 32)

# 3. Push schema & seed
npm run db:push
npm run db:seed

# 4. Dev server
npm run dev
```

Open http://localhost:3000

**Demo accounts:** `alice@example.com` / `bob@example.com` / `charlie@example.com` — password: `password123`

## Features

| Feature | How |
|---------|-----|
| Create session | Dashboard → New Session → add restaurant options |
| Join session | Open session link → Join Session |
| Vote | Click Vote on any option — toggle-able, optimistic UI |
| Close voting | Session owner → Close Voting button |
| Set appointment | Owner after voting closes → Appointment form |
| Notifications | Bell icon — polls every 30s, badge shows unread count |

## Project Structure

```
src/
  app/
    (auth)/login, register     — public auth pages
    (dashboard)/               — protected, shared navbar
      page.tsx                 — session list (grouped by status)
      sessions/new/            — create session form
      sessions/[id]/           — detail: vote panel + appointment
    api/auth, notifications    — route handlers
  components/
    SessionCard, VotePanel, AppointmentForm, NotificationBell
    CreateSessionForm, CloseVotingButton, JoinSessionButton
  lib/
    auth.ts, db.ts, utils.ts
    actions/session, vote, appointment, notification, auth
  types/index.ts
prisma/schema.prisma
```

## Swap to PostgreSQL

Change `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Then `npm run db:migrate`.