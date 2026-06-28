# CLAUDE.md — PortoLook (MyAssets) Project

Panduan utama untuk AI assistant dalam mengerjakan **PortoLook**: aplikasi pencatatan dan pemantauan portofolio pribadi lintas mata uang dengan i18n (EN + ID).

---

## Project Overview

- **Nama:** PortoLook (formerly MyAssets)
- **Tipe:** Full-stack Web Application (SaaS-style dashboard)
- **Tech Stack:** Next.js 16 (App Router, Turbopack) + TypeScript + Better Auth + Drizzle ORM + PostgreSQL
- **Mata uang:** IDR (default, tersimpan di DB) + USD (display via FX conversion)
- **Bahasa:** English (default) + Bahasa Indonesia
- **Auth:** Better Auth (email/password) dengan session cookies
- **Charts:** Recharts (responsive containers)
- **Form:** React Hook Form + Zod
- **Date:** date-fns

---

## Folder Structure

```
my-assets/
├── app/
│   ├── (auth)/login/page.tsx              # Login (no locale prefix)
│   ├── [locale]/                          # All UI under locale prefix
│   │   ├── layout.tsx                     # Providers (Intl, Theme, Currency)
│   │   ├── page.tsx                       # Redirect → /dashboard
│   │   └── (app)/                         # Authenticated shell
│   │       ├── layout.tsx                 # Sidebar + Header + main
│   │       ├── dashboard/page.tsx
│   │       ├── assets/
│   │       │   ├── page.tsx               # List view
│   │       │   ├── new/page.tsx           # Multi-step create form
│   │       │   └── [id]/
│   │       │       ├── page.tsx           # Detail
│   │       │       ├── update/page.tsx
│   │       │       ├── deposit/page.tsx
│   │       │       ├── sell/page.tsx
│   │       │       ├── transaction/page.tsx
│   │       │       ├── transactions/[trxId]/edit/page.tsx
│   │       │       └── valuations/[valId]/edit/page.tsx
│   │       └── settings/
│   │           ├── page.tsx               # Server entry
│   │           └── SettingsClient.tsx     # Interactive form
│   ├── api/
│   │   ├── auth/[...all]/route.ts         # Better Auth handler
│   │   ├── assets/                        # CRUD + sub-routes
│   │   ├── dashboard/route.ts             # Aggregated data
│   │   ├── fx-rate/route.ts               # Public FX endpoint
│   │   └── user/preferences/route.ts      # PATCH locale/currency/fx
│   ├── layout.tsx                         # Root: html + body + providers chain
│   ├── globals.css                        # Tailwind v4 + design tokens
│   └── page.tsx                           # Trampoline → /[locale]
├── components/
│   ├── ui/                                # shadcn/ui primitives (don't edit)
│   ├── app-shell/                         # Layout chrome
│   │   ├── Sidebar.tsx, Header.tsx
│   │   ├── LocaleSwitcher.tsx, CurrencySwitcher.tsx, ThemeToggle.tsx
│   ├── dashboard/                         # Bento dashboard cards
│   │   ├── NetWorthCard.tsx, GainLossCard.tsx
│   │   ├── FilterTabs.tsx, SectorBreakdown.tsx
│   │   ├── OverviewChart.tsx, AssetTable.tsx
│   ├── assets/                            # Asset-related
│   │   ├── AssetDetailHeader.tsx
│   │   ├── AssetsListClient.tsx           # Dedicated list page
│   │   ├── PerformanceChart.tsx, TransactionTable.tsx
│   ├── providers/                         # React context providers
│   │   ├── CurrencyProvider.tsx, ThemeProvider.tsx
│   └── shared/                            # Cross-page primitives
│       ├── PageHeader.tsx, EmptyState.tsx
│       ├── CurrencyDisplay.tsx, GainLossBadge.tsx
│       ├── HistoryFilter.tsx, Logo.tsx
├── lib/
│   ├── auth.ts, auth-client.ts, auth-server.ts
│   ├── formatters.ts                      # Sync (client-safe)
│   ├── formatters-server.ts               # Async (with FX conversion)
│   ├── calculations.ts, validations.ts, utils.ts
│   ├── currency/
│   │   ├── fx.ts                          # FX rate fetch + cache (unstable_cache)
│   │   └── convert.ts
│   ├── db/{index,schema,seed}.ts
│   ├── i18n/{routing,request}.ts
│   └── queries/dashboard.ts               # Shared query helper
├── messages/{en,id}.json                  # Translation files
├── hooks/useMounted.ts                    # React 19 mounted detector
├── types/index.ts                         # Shared TS types
├── drizzle/migrations/                    # Auto-generated
├── proxy.ts                               # Middleware (Next.js 16: proxy.ts)
└── next.config.ts, tsconfig.json, eslint.config.mjs, drizzle.config.ts
```

---

## Database Schema

### Enums
- `asset_type`: `SAHAM | CRYPTO | EMAS | REKSA_DANA | P2P | LAINNYA`
- `asset_mode`: `INVESTING | TRADING`
- `transaction_type`: `BUY | SELL | DEPOSIT | WITHDRAWAL | UPDATE`
- `asset_status`: `ACTIVE | SOLD` (implicit)

### Tables

**`assets`**
- `id`, `userId`, `name`, `type`, `mode`, `isNominal` (cash-only)
- `notes`, `quantity`, `buyPrice`, `buyDate` (INVESTING fields)
- `platformName`, `initialCapital` (TRADING fields)
- `status`, `createdAt`, `updatedAt`

**`valuations`** — historical snapshots
- `id`, `assetId`, `value` (in stored currency), `recordedAt`, `notes`

**`transactions`**
- `id`, `assetId`, `type`, `amount`, `quantity?`, `price?`, `realizedGain?`, `fundSource?`, `date`, `notes`

**`user`** (Better Auth) — extended via `additionalFields`:
- `currency` (default `"IDR"`)
- `locale` (default `"en"`)
- `fxRateOverride` (nullable number)

> Generated automatically by Better Auth — don't write manual migration for it.

---

## Business Logic & Calculations

### Total Modal (initial capital)
- **INVESTING (non-nominal):** `qty × buyPrice` (saham = lot × 100 × price, crypto = unit × price, emas = gram × price)
- **INVESTING (nominal):** `initialCapital`
- **TRADING:** `initialCapital`

### Current Value
Latest `valuation.value` from `valuations` table (by `recordedAt DESC`), fallback to `totalModal`.

### Gain/Loss
- **Nominal:** `currentValue - totalModal + sum(transactions.realizedGain)`
- **Percent:** `(nominal / totalModal) × 100`

### Sector Breakdown
`groupBy(assetType) → sum(currentValue) → percent of total`

### FX Conversion (server-side only)
- Stored currency = `IDR`, display = `USD` → divide by rate
- Stored = `USD`, display = `IDR` → multiply by rate
- Rate source: `unstable_cache` wrapper around Frankfurter API (`/api/fx-rate`), 24h revalidate
- User override via `user.fxRateOverride`

---

## Pages & Features

### Auth Flow
- `/(auth)/login` — single page, redirect to `/{locale}/dashboard` after success
- Logout: client-side `authClient.signOut()` → router push to `/{locale}/login`

### App Shell (authenticated)
- **Desktop:** persistent sidebar (left) with nav links + locale/currency/theme controls
- **Mobile:** header with sheet drawer

### Dashboard (`/{locale}/dashboard`)
- **NetWorthCard:** total net worth + total capital
- **GainLossCard:** total return (nominal + percent, color-coded)
- **OverviewChart:** bar chart of asset values (Recharts, `useMounted` guard)
- **SectorBreakdown:** donut/pie of asset type distribution
- **AssetTable:** inline paginated table of assets (5/page)
- **TransactionTable:** global transaction history (time filter)
- **Empty state:** when `assets.length === 0`

### Assets (`/{locale}/assets`)
- Full table with: search (name + platform), type filter, mode filter, sort (8 options), pagination (10/page)
- Per-row dropdown: Detail / Update / Sell / Deposit / Withdraw
- Empty state with CTA → `/assets/new`

### Asset Detail (`/{locale}/assets/[id]`)
- Header: back button, name + badges, action buttons (Deposit/Sell/Withdraw/Update/Delete)
- Hero stats: current value + G/L
- Meta info bar: quantity/recording, type, platform, buy date
- PerformanceChart (line/area) + history table

### New Asset (`/{locale}/assets/new`)
- Multi-step form (3 steps): Type → Details → Confirm
- Submit → POST `/api/assets` → redirect to detail

### Settings (`/{locale}/settings`)
- Profile section: name + email (read-only)
- Preferences section:
  - Language: EN / ID (saved via `PATCH /api/user/preferences`)
  - Currency: IDR / USD
  - FX rate override: optional manual rate

---

## Design System (Linear-inspired)

### Tokens (defined in `globals.css` via `@theme`)
- **Primary:** `#5E6AD2` (Linear indigo)
- **Neutral palette:** 50–950 grayscale
- **Gain:** emerald-600 / emerald-400 (dark)
- **Loss:** red-600 / red-400 (dark)
- **Radius:** `--radius-md: 6px`, `--radius-lg: 8px`
- **Fonts:** Inter (sans), JetBrains Mono (mono)

### Typography
- Display (page title): `text-2xl sm:text-3xl font-bold tracking-tight`
- Section title: `text-base font-medium`
- Card label: `text-xs font-medium uppercase tracking-wider text-muted-foreground`
- Numeric primary: `text-2xl font-bold tabular-nums tracking-tight`
- Numeric secondary: `text-sm tabular-nums`

### Card Hierarchy
- **Default card:** `border border-border bg-card rounded-xl shadow-sm`
- **Empty state:** `border border-dashed border-border bg-card rounded-lg`
- **Bento tile:** `p-5 flex flex-col gap-3`
- **No gradients** in cards (Linear convention)

### Spacing Scale
- `gap-2` (8px), `gap-3` (12px), `gap-4` (16px), `gap-6` (24px), `gap-8` (32px), `gap-12` (48px)

---

## i18n (next-intl v4)

### Routing
- `localePrefix: "always"` — every URL must start with `/en` or `/id`
- `proxy.ts` runs intl middleware + auth check
- Plain `<Link href="/dashboard">` works because middleware redirects to `/en/dashboard`

### Translation files
- `messages/en.json` and `messages/id.json` — namespaces:
  - `metadata`, `common`, `nav`, `settings`, `errors`, `auth`
  - `dashboard`, `assets`, `filters`, `transactions`, `forms`, `empty`
  - `assetTypes`, `assetModes`

### Usage
- **Client component:** `const t = useTranslations("dashboard")` → `t("netWorth")`
- **Server component:** `const t = await getTranslations("dashboard")` → `t("netWorth")`
- **With placeholder:** `tCommon("showing", { start: 1, end: 10, total: 25 })`
- **Locale prop on `<html lang>`:** read from `x-next-intl-locale` header in root layout

### Adding a new key
1. Add to `en.json` and `id.json` (same path)
2. Use `useTranslations("namespace")` + `t("key")`
3. Run `pnpm build` — missing keys fail at build time

---

## Coding Conventions

1. **TypeScript strict** — no `any` except in narrow adapter code
2. **Server Components by default** — add `"use client"` only when needed
3. **Sync formatters in client, async in server** — `formatCurrency` (sync, no conversion) for client; `formatCurrencyWithConversion` (async) for server pre-formatting
4. **React 19 hooks:** use `useMounted` for chart/ResponsiveContainer gating; disable `react-hooks/set-state-in-effect` only where genuinely needed (data fetching on mount)
5. **API route protection:** every route must validate session via `auth.api.getSession({ headers: await headers() })` — return `{ success: false, error: "Unauthorized" }, { status: 401 }` if missing
6. **Drizzle queries:** prefer `db.query.*` (relational) for joins; `db.select()` for simple queries
7. **Zod validation:** all form input via `react-hook-form` + `@hookform/resolvers/zod`
8. **Consistent API response:** `{ success: true, data: ... }` or `{ success: false, error: "..." }`
9. **No hardcoded user-facing strings** — always use `t("key")`
10. **Icon library:** `lucide-react`, individual imports, `size={16}` for inline
11. **Tailwind v4:** utility-first, no custom CSS unless required, `cn()` for conditional classes

---

## Critical Gotchas

1. **Async client components crash** — never return a Promise from a Client Component. Sync formatters (`formatCurrency`) only.
2. **`useMounted` hook** — `hooks/useMounted.ts` uses `useSyncExternalStore` to avoid React 19 `set-state-in-effect` rule; wrap Recharts `ResponsiveContainer` with `{mounted && <ResponsiveContainer>}`.
3. **`proxy.ts` matcher** — must exclude all `/api/*` (not just `/api/auth`); current: `"/((?!api|_next/static|_next/image|favicon.ico).*)"`
4. **Root layout** — Next.js requires `<html>` + `<body>` in `app/layout.tsx`; `[locale]/layout.tsx` only wraps with providers.
5. **`/[locale]/page.tsx`** — must redirect to `/[locale]/dashboard` (without it, `/id` 404s).
6. **Better Auth + `additionalFields`** — field names in schema must match field names in `additionalFields` config exactly.

---

## Environment Variables

```
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Verification Commands

```bash
pnpm exec tsc --noEmit        # TypeScript zero errors
pnpm lint                     # ESLint zero warnings
pnpm build                    # Production build zero warnings
```

All three must pass before declaring work complete.
