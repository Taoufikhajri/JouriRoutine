# ⭐ Little Star Adventure

> Build good habits. Complete your missions. Become your best self.

A magical, game-like daily-routine app for children (built first for a 7-year-old), with Islamic habits — Salah, Quran, adhkar, good manners, helping family, gratitude and charity — woven in positively. Parents build the routine; the child completes missions, earns XP, coins, stars and badges, opens treasure chests and travels across a daily adventure map.

## Quick start (local)

The app uses **PostgreSQL**. Two easy options for your computer:

- **Local, no account:** run `npx prisma dev --name jouri --detach`. It prints a `postgres://…localhost:51214…` address; put it in `.env` for both variables and add `&connection_limit=1&pgbouncer=true` to the end (the local server accepts one connection at a time).
- **Cloud:** a separate database (or Neon `dev` branch) so local testing never touches real family data.

```bash
npm install
cp .env.example .env   # paste the dev branch's pooled + direct connection strings
npm run setup          # creates the tables and seeds demo data
npm run dev            # http://localhost:3000
```

**Demo credentials (development only — the seed refuses to run in production):**

| Who    | How to log in |
| ------ | ------------- |
| Parent | `parent@example.com` / `DemoParent123!` |
| Child  | “I'm a kid” → family code `STAR-1234` → tap **Jouri** → PIN `1234` |

`npm run db:reset` wipes and reseeds. The seed generates 10 days of history, so the streak, badges, calendar and analytics have data straight away. It also leaves one pending reward request for you to approve.

Other scripts: `npm run typecheck`, `npm run lint`, `npm run build:local` (build without touching the database), `npm run db:migrate` (create a new migration after changing the schema).

---

## A. Application architecture

| Layer | Choice | Notes |
| --- | --- | --- |
| Framework | **Next.js 16** (App Router, Server Components, Server Actions), TypeScript strict | `proxy.ts` (formerly middleware) does optimistic redirects only |
| UI | Tailwind CSS v4, Motion (Framer Motion), Lucide icons, own shadcn-style primitives in `src/components/ui` | Fonts: Baloo 2 (display) + Nunito (body) |
| Data | **Prisma ORM** + **PostgreSQL** (Neon) | Migrations in `prisma/migrations`, applied automatically on every Vercel build |
| Auth | Custom DB-backed sessions | See *Security* |
| Validation | Zod on every server action | |
| Drag & drop | dnd-kit (pointer, touch and keyboard sensors) | |

**Why custom auth instead of Auth.js?** The two login styles are very different: parents use email + password, children use family code + avatar + PIN. Each needs lockout and server-side revocation. A small hand-written module is easier to audit than bending a credentials provider. Sessions are random 256-bit tokens; only their SHA-256 hash is stored, in the `Session` table.

### Security
- bcrypt password/PIN hashing; lockout after 5 failed attempts (5 min); constant-time dummy compare for unknown users.
- `httpOnly`, `SameSite=Lax`, `Secure` (prod) cookies. Server Actions get Next's built-in Origin check against CSRF.
- **Role and child id are never trusted from the client.** `requireParent()` / `requireChild()` load the role from the DB. Every parent mutation re-checks that the routine, task, reward or child belongs to the parent's family (`ownedRoutine`, `ownedTask`, `assertFamilyChild`). Child actions use the child id from the session only.
- Security headers in `next.config.ts`; no third-party scripts, ads, tracking, chat or public profiles.

### Folder structure
```
prisma/            schema.prisma, seed.ts
src/app/           routes: (auth)/login|signup|forgot-password|reset-password,
                   onboarding, child/*, parent/*, manifest.ts
src/components/    ui/ (Button, Field, Modal…), brand/ (Mascot “Noor”, MagicSky)
src/config/        app.ts (product name ⇢ rename here), game.ts (levels, XP tiers, chests, map stages)
src/features/      auth/, avatar/, child/ (HUD, task cards, map, shop, celebrations), parent/, shared/
src/i18n/          messages/{en,fr,ar}.ts, content.ts (ready-made missions/rewards), server.ts (getT), client.tsx (useT)
src/lib/           db, dates (family-timezone days), days-mask, validation, sound
src/server/        auth/ (session, guards, password), actions/ (server actions),
                   services/ (pure game engine, DB injected), queries/, catalog/ (templates, badges, avatars, rewards)
```
The game engine in `src/server/services` takes the DB client as a parameter, so the same code runs inside transactions, server actions and the seed script.

## B. Database schema (Prisma)

- **Identity:** `Family` (timezone, login code, sound setting) · `User` (role, email for parents, hashed secret, lockout) · `Session` · `PasswordResetToken` · `ParentProfile` · `ChildProfile` (cached XP/coins/streak, avatar, login mode; login name unique per family)
- **Routines:** `Routine` (per child, category, weekday bitmask, active, order) · `RoutineTask` (icon, time, kind, difficulty, XP, coins, required, weekday bitmask, order, prayer and Quran fields)
- **Progress:** `TaskCompletion` (unique per child, task and day; snapshots the title/icon/kind so history survives edits) · `DailyProgress` (totals, success/perfect flags) · `DailyStat` (per-day breakdown such as `cat:MORNING` or `kind:PRAYER`, which drives badges and analytics) · `XPTransaction` / `CoinTransaction` (ledgers; the totals on `ChildProfile` are a cache)
- **Rewards:** `Reward` · `RewardRedemption` (PENDING → APPROVED/REJECTED; coins are deducted only on approval)
- **Gamification:** `Achievement` (rule + dimension + threshold) · `ChildAchievement` · `ChestOpening` · `Avatar` · `AvatarItem` · `ChildAvatarItem` · `QuranMemorization`
- **Notifications:** `Notification` (in-app; parent-facing when `childId` is null)

A day is a `YYYY-MM-DD` string in the **family's timezone**. A day counts toward the **streak** when at least 80% of its required missions are done. A **Perfect Day** (⭐ on the calendar, golden chest, +20 coins) means 100% of required missions. Optional "bonus" missions add XP and coins but never block a perfect day.

## C. Main user flows
1. **Parent signup → onboarding:** family → child (name, age, character, PIN) → routine templates → rewards → "Start the adventure" (hands the device to kid mode).
2. **Kid login:** the device remembers the family code → the child taps their character → PIN pad. A wrong PIN shows a shake and "Oops! Let's try that PIN again 🌈".
3. **First visit:** welcome screen → START MY ADVENTURE.
4. **Mission:** tap DONE → optimistic check → confetti, cheer, +XP, coins fly to the wallet, progress ring fills. Then any perfect-day, streak-milestone, badge or level-up moments play in sequence. "Oops, not yet" undoes a mission.
5. **Chests:** Small (after 5 missions) and Golden (perfect day): shake → burst → coins, XP and sometimes an avatar item.
6. **Rewards:** REDEEM → "Waiting for Mom & Dad" (coins reserved, not spent) → the parent approves or rejects → the child sees "Yay! … is yours!".
7. **Parent:** dashboard → routine builder (drag to reorder, toggle, duplicate, templates, prayer panel) → progress (today/week/month, habit bars, calendar with day details).

## D. Page structure
`/login` `/signup` `/forgot-password` `/reset-password` `/onboarding`
`/child/today` `/child/adventure` `/child/rewards` `/child/badges` `/child/profile` `/child/welcome`
`/parent` `/parent/children` `/parent/routines` `/parent/rewards` `/parent/progress` `/parent/achievements` `/parent/settings`

## E. Component structure (highlights)
- Child: `GameProvider` (sound and celebration queue) → `CelebrationLayer` · `Hud` · `BottomNav` · `TodayBoard` → `RoutineSection` → `TaskCard` · `ChestPanel` · `AdventureMap` · `RewardShop` · `AvatarStudio` · `useMissions` (optimistic completion shared by the list and the map)
- Parent: `ParentNav` (sidebar / mobile tabs, child switcher, kid-mode button) · `RoutineBuilder` → `RoutineCard` → `SortableTask` + `TaskEditor` / `RoutineEditor` / `PrayerPanel` / `TemplatePicker` · `ApprovalList` · `RewardManager` · `ChildrenManager` · `SettingsForms` · `OnboardingWizard`
- Shared: `MonthCalendar` (symbols, not only colour), `BadgeGrid`, `AvatarView`, `Mascot`

## F. Roadmap
| Phase | Status |
| --- | --- |
| 1 — Auth, parent and child accounts, DB, dashboards, routine builder, missions, XP, coins, daily progress | ✅ Done |
| 2 — Rewards and approval, badges, streaks and milestones, levels, celebrations | ✅ Done |
| 3 — Adventure map, treasure chests, avatars and items, calendar, analytics | ✅ Done |
| 4 — PWA | 🟡 Manifest and icons (installable); no offline service worker yet |
| 4 — Localization | ✅ English, French and Arabic (full right-to-left layout), for both the kids' app and the parent area |
| 4 — Prayer API | 🟡 `PrayerTimeProvider` interface + `syncPrayerTimes` stub (`src/server/services/prayer-times.ts`) |
| 4 — Notifications | 🟡 In-app only (reward requests, badges, level-ups, streaks) |
| 4 — Ramadan mode | 🟡 Ramadan routine template (off by default; switch it on from Routines) |
| 4 — Advanced Quran tracking | 🟡 Memorization progress per surah (parent edits, child sees bars) |

### Sound effects
- All sounds are generated in the browser (`src/lib/sound.ts`): no audio files, and nothing plays until the child taps.
- PIN keys, wrong PIN ("oh-oh"), menu taps, mission done (pop → chime → coin), undo, badges, level-up fanfare, perfect day, streak, chest wobble and opening, wishes, wearing items, welcome melody.
- Parents: Settings → switch sound off entirely, or choose Soft / Medium / Loud (with a "Try a sound" button).
- Kids: the 🔊 button in the top bar mutes just that device.

### Languages (English · Français · العربية)
- The **family language** (Parent → Settings) applies to the parent area and the kids' app. The signed-out pages have their own language chips, remembered in a cookie.
- Arabic switches the whole app to right-to-left (`<html dir="rtl">`), uses the rounded *Baloo Bhaijaan 2* font, and keeps Western digits (change `intl` in `src/i18n/index.ts` to `"ar"` for Arabic-Indic digits). The PIN pad always stays 1-2-3 left to right.
- Ready-made routines, missions and rewards are stored in the database. They are created in the family language. When the language changes, the "translate ready-made content" option re-translates every unedited one (`src/i18n/content.ts`); anything a parent typed is left alone.
- Badges, levels, map places, avatars and items are translated by key. Notifications are written in the family language.
- To add a language: copy `messages/en.ts` into a new file (TypeScript checks every key), add it to `LOCALES` in `src/i18n/index.ts`, and add a column in `content.ts`.

## Deploying to Vercel

1. **Database:** in Neon, copy the **main** branch's *pooled* and *direct* connection strings (Dashboard → Connect).
2. **Import:** on [vercel.com](https://vercel.com) → *Add New → Project* → pick this GitHub repository. The framework is detected as Next.js; keep the defaults.
3. **Environment variables** (Production and Preview):
   | Name | Value |
   | --- | --- |
   | `DATABASE_URL` | Neon pooled connection string |
   | `DIRECT_URL` | Neon direct connection string |
   | `APP_URL` | your site address, e.g. `https://little-star.vercel.app` |
4. **Deploy.** The build runs `prisma migrate deploy` (creates or updates the tables), then `next build`. Every push to `main` redeploys.
5. **First use:** open the site → *Create a parent account* → the onboarding wizard sets up the family. The demo seed is never run in production.
6. **On the tablet:** open the site, enter the family code once (Settings), then *Add to Home Screen* so it opens like an app.

### Still to do for production
- Plug an email provider (e.g. Resend) into `src/server/mailer.ts`; until then "Forgot password" sends nothing in production.
- Add rate limiting for the family-code form (per-account PIN/password lockout already exists).
- Vercel's free Hobby plan is for personal, non-commercial use; a SaaS for other families needs a paid plan.
