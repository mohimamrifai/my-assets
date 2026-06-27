# MyAssets Foundation Redesign — Phase 1 Design Spec

**Date:** 2026-06-26
**Status:** Approved
**Phase:** 1 of N (Foundation)
**Scope:** All authenticated app pages except `/login`

---

## 1. Goals

1. **Modern SaaS aesthetic** — Minimal Tech (Linear/Vercel-inspired): monochrome neutral, refined typography, subtle borders, generous whitespace.
2. **Bilingual UI** — English (default) + Bahasa Indonesia with URL-based locale routing.
3. **Multi-currency display** — IDR (storage) + USD (display) with live FX conversion.
4. **Theme support** — Light default + Dark toggle.
5. **App shell overhaul** — Sidebar nav with sections, header with switchers, settings page.

Out of Phase 1 scope (Phase 2+): dashboard cards/charts visual redesign, asset list page, asset detail visual redesign, empty/loading states polish, full copy translation.

---

## 2. Decisions Locked

| Decision | Choice |
|---|---|
| Approach | Phase 1 Foundation first, redesign pages in subsequent phases |
| i18n library | `next-intl` |
| Locale routing | URL prefix `/[locale]/...` |
| FX rate source | Frankfurter API (auto) + manual override in Settings |
| FX layer location | Server-side via `unstable_cache` |
| Visual style | Minimal Tech (Linear/Vercel) |
| Theme default | Light + Dark toggle |
| Theme library | `next-themes` (already installed) |
| Primary accent | `#5E6AD2` (Linear blue) — replaces emerald `#16A34A` |
| Font | Inter (Variable) body, JetBrains Mono for numbers |

---

## 3. Architecture

### 3.1 Folder Structure (After Phase 1)

```
app/
├── [locale]/                        # NEW
│   ├── layout.tsx                   # Locale-aware root
│   ├── page.tsx                     # redirect → /dashboard
│   ├── (app)/                       # App shell with sidebar
│   │   ├── layout.tsx               # NEW: Sidebar + header
│   │   ├── dashboard/page.tsx       # moved
│   │   ├── assets/
│   │   │   ├── page.tsx             # NEW (placeholder Phase 2)
│   │   │   ├── new/page.tsx         # moved
│   │   │   └── [id]/...             # moved (all subroutes)
│   │   └── settings/page.tsx        # NEW
│   └── (auth)/
│       └── login/page.tsx           # moved (not redesigned)
├── (auth)/
│   └── login/page.tsx               # touched only to be locale-aware
├── api/
│   ├── fx-rate/route.ts             # NEW
│   ├── user/preferences/route.ts    # NEW
│   └── ...                          # existing
├── layout.tsx                       # minimal wrapper
└── page.tsx                         # redirect to /en/dashboard
```

### 3.2 Provider Stack (Root order, top→bottom)

1. `NextIntlClientProvider` (locale messages)
2. `ThemeProvider` (next-themes)
3. `SessionProvider` (Better Auth — wrapped, kept)
4. `CurrencyProvider` (UPDATED — reads user.currency + fxRateOverride)
5. `Toaster` (sonner)

---

## 4. i18n Setup

### 4.1 Lib Files

**`lib/i18n/routing.ts`** — defines locales, default locale, creates navigation helpers:
```ts
import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";

export const routing = defineRouting({
  locales: ["en", "id"],
  defaultLocale: "en",
  localePrefix: "always",
});

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
```

**`lib/i18n/request.ts`** — server-side config:
```ts
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
```

**`middleware.ts`** — combines next-intl middleware with existing proxy logic:
```ts
import createMiddleware from "next-intl/middleware";
import { routing } from "@/lib/i18n/routing";
// + existing proxy code merged in
```

### 4.2 Message Files

**`messages/en.json`** and **`messages/id.json`** with namespaces:
- `common` — buttons, generic labels
- `nav` — sidebar items
- `settings` — preferences page
- `errors` — toast messages
- (Phase 2) `dashboard`, `assets`, `forms`

For Phase 1, only `common`, `nav`, `settings`, `errors` are translated. Other strings are temporarily left as-is in Indonesian (Phase 2 will translate).

---

## 5. Currency & FX System

### 5.1 Schema Migration

Add to `user` table:
```ts
locale: text("locale").default("en").notNull(),
fxRateOverride: real("fx_rate_override"), // nullable
```

### 5.2 Server-side FX Layer

**`lib/currency/fx.ts`**:
```ts
import { unstable_cache } from "next/cache";

export const getUsdToIdrRate = unstable_cache(
  async () => {
    const res = await fetch(
      "https://api.frankfurter.app/latest?from=USD&to=IDR",
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) throw new Error("FX fetch failed");
    const data = await res.json();
    return data.rates.IDR as number;
  },
  ["fx-usd-idr"],
  { revalidate: 86400 }
);
```

**`lib/currency/convert.ts`**:
```ts
export async function convertCurrency(
  value: number,
  from: "IDR" | "USD",
  to: "IDR" | "USD",
  overrideRate?: number | null
): Promise<number> {
  if (from === to) return value;
  const rate = overrideRate ?? (await getUsdToIdrRate());
  return from === "USD" ? value * rate : value / rate;
}
```

### 5.3 API Routes

**`GET /api/fx-rate`** — public cached rate:
```ts
export async function GET() {
  try {
    const rate = await getUsdToIdrRate();
    return Response.json({ rate, source: "frankfurter" });
  } catch {
    return Response.json({ error: "FX unavailable" }, { status: 503 });
  }
}
```

**`PATCH /api/user/preferences`** — update locale/currency/FX override:
- Auth-protected
- Accepts `{ locale?, currency?, fxRateOverride? }`
- Updates `user` table
- Returns updated user

### 5.4 Updated Formatters

```ts
// lib/formatters.ts
import { getLocale } from "next-intl/server";
import { convertCurrency } from "./currency/convert";

export async function formatCurrency(
  value: number,
  options: {
    stored?: "IDR" | "USD";           // source currency (default IDR)
    display?: "IDR" | "USD";          // target currency
    fxRateOverride?: number | null;
  } = {}
) {
  const locale = await getLocale();
  const stored = options.stored ?? "IDR";
  const display = options.display ?? stored;
  const converted = await convertCurrency(value, stored, display, options.fxRateOverride);

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: display,
    minimumFractionDigits: display === "USD" ? 2 : 0,
    maximumFractionDigits: display === "USD" ? 2 : 0,
  }).format(converted);
}
```

### 5.5 Updated `CurrencyProvider`

Now also exposes:
- `currency` — active display currency
- `fxRateOverride` — user's manual rate
- `setCurrency(c)` — calls PATCH /api/user/preferences, refreshes router
- `setFxOverride(r)` — same

Reads from session on mount, optimistic updates.

---

## 6. Design Tokens & Theme

### 6.1 globals.css Updates

**Light theme** (Linear-inspired neutral):
```css
:root {
  --background: #FAFAFA;
  --foreground: #0A0A0A;
  --card: #FFFFFF;
  --card-foreground: #0A0A0A;
  --primary: #5E6AD2;          /* Linear blue */
  --primary-foreground: #FFFFFF;
  --muted: #F5F5F5;
  --muted-foreground: #737373;
  --border: #E5E5E5;
  --input: #E5E5E5;
  --ring: #5E6AD2;
  --destructive: #DC2626;
  --success: #10B981;
  --radius: 0.5rem;
}

.dark {
  --background: #0A0A0A;
  --foreground: #FAFAFA;
  --card: #171717;
  --card-foreground: #FAFAFA;
  --primary: #5E6AD2;
  --primary-foreground: #FFFFFF;
  --muted: #262626;
  --muted-foreground: #A3A3A3;
  --border: #262626;
  --input: #262626;
  --ring: #5E6AD2;
}
```

### 6.2 Font

Replace `Poppins` with `Inter` (Variable) for body. Keep numeric monospace for finance tables (`font-mono`).

### 6.3 Component Style Updates

- Rounded corners: `rounded-lg` (was `rounded-md`)
- Border weight: 1px neutral
- Shadow: removed unless elevated (modals/dropdowns)
- Density: more whitespace, less cramped

---

## 7. App Shell

### 7.1 Sidebar (`components/app-shell/Sidebar.tsx`)

Desktop only (≥md). Fixed left, 240px wide, full height. Sections:
- Logo (top)
- Navigation:
  - Dashboard (`/dashboard`) — `LayoutDashboard` icon
  - Assets (`/assets`) — `Briefcase` icon (Phase 2: full page)
  - New Asset (`/assets/new`) — `PlusCircle` icon
- Footer: User menu (avatar, name) + Settings link + Logout

Uses `next-intl` `Link` and `useTranslations`.

### 7.2 Header (`components/app-shell/Header.tsx`)

Mobile only (<md). Sticky top, 56px. Contains: logo, page title, switchers.

### 7.3 Switchers

**`LocaleSwitcher.tsx`** — DropdownMenu:
- Globe icon trigger
- "English" / "Bahasa Indonesia" options
- onSelect: navigate to new locale path, PATCH preferences

**`CurrencySwitcher.tsx`** — DropdownMenu:
- DollarSign icon trigger (or current symbol)
- "IDR" / "USD" options
- onSelect: PATCH preferences, refresh router

**`ThemeToggle.tsx`** — Button:
- Sun/Moon icons
- onClick: `setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')`

### 7.4 App Shell Layout

`app/[locale]/(app)/layout.tsx`:
```tsx
<div className="min-h-screen bg-background flex">
  <Sidebar />
  <div className="flex-1 md:pl-60">
    <Header />
    <main className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {children}
      </div>
    </main>
  </div>
</div>
```

---

## 8. Settings Page

### Route: `app/[locale]/(app)/settings/page.tsx`

Sections (rendered as `Card` components):

### 8.1 Profile Card
- Read-only display of `session.user.name` and `session.user.email`

### 8.2 Preferences Card
- **Language**: Radio cards (EN/ID), single column
- **Display Currency**: Radio cards (IDR/USD)
- Save button (or auto-save on change with debounce)

### 8.3 Exchange Rate Card
- Live rate display: "1 USD = 16,234 IDR (via Frankfurter, 2h ago)"
- Override input (number)
- "Reset to auto" button
- Last fetched timestamp

### 8.4 API

Single endpoint: `PATCH /api/user/preferences` with partial body `{ locale?, currency?, fxRateOverride? | null }`. Returns `{ success, user }`.

---

## 9. Error Handling

| Scenario | Behavior |
|---|---|
| Frankfurter API down | Fall back to last `unstable_cache` value. If never cached, use `15500` constant + show "rate unavailable" banner |
| User has no `locale` set | Default to `en` (schema default) |
| User switches URL locale but session.user.locale differs | First switch persists to session; subsequent visits use URL |
| Theme toggle during SSR | `next-themes` injects script pre-hydration, no flash |
| `formatCurrency` called in client component | Wrap async — only safe in server components. Use `useFormatCurrency()` hook for client components |
| FX override is 0 or negative | Validation rejects with toast |

---

## 10. Implementation Order

1. **Install**: `pnpm add next-intl`
2. **Schema migration**: add `locale`, `fxRateOverride` to user table
3. **i18n config**: `lib/i18n/*`, `messages/*.json`, `middleware.ts`
4. **Move routes**: relocate `app/(app)/...` → `app/[locale]/(app)/...`, `app/(auth)/login` → `app/[locale]/(auth)/login` + alias at `app/(auth)/login`
5. **Currency layer**: `lib/currency/*`, `/api/fx-rate`, `/api/user/preferences`
6. **Update formatters**: locale-aware + conversion
7. **Theme**: `next-themes` provider, globals.css tokens, font swap
8. **App shell**: Sidebar, Header, switchers, ThemeToggle, layout composition
9. **Settings page**: full implementation
10. **Update existing pages**: replace hardcoded ID strings with `t('key')` (nav, common, errors only)
11. **Verify**: `pnpm tsc --noEmit` + `pnpm build` + manual smoke test

---

## 11. Inconsistencies Found (Pre-Phase 2 Cleanup)

These will be addressed in Phase 2 alongside page redesign:
- `CLAUDE.md` says asset types = `SAHAM/CRYPTO/EMAS` but schema includes `REKSA_DANA/P2P/LAINNYA`. **Update CLAUDE.md.**
- Dashboard page has dead code: `fetchDashboardData` declared but `useEffect` uses inline fetch. **Remove dead code in Phase 2.**
- PerformanceChart has debug overlay (`Points: X | Range: Y`). **Remove in Phase 2.**
- Asset detail page has duplicate fetch logic (callback + useEffect). **Consolidate in Phase 2.**

---

## 12. Recommended New Features (Post-Phase 1, for User Approval)

These are not in scope but flagged for future phases:
1. **Onboarding flow** — First-time user setup wizard for first asset
2. **CSV/PDF export** — Per asset or portfolio-wide
3. **Goal tracking** — Set target net worth, see progress
4. **Recurring deposits** — Schedule regular buy transactions
5. **Multi-asset comparison** — Side-by-side metric comparison
6. **PWA support** — Offline access, install prompt
7. **Email notifications** — Threshold alerts for gain/loss
8. **Tags/categories** — Custom tagging beyond type
9. **Dividend/income tracking** — Separate from capital gains
10. **Cost basis methods** — FIFO/LIFO/Average for sell transactions

---

## 13. Acceptance Criteria

Phase 1 is complete when:
- [ ] App accessible at `/en/dashboard` and `/id/dashboard`
- [ ] Locale switcher changes URL and persists to `user.locale`
- [ ] Currency switcher changes display currency and persists
- [ ] FX rate auto-fetches from Frankfurter, cached 24h
- [ ] FX override works and shows in settings
- [ ] Settings page fully functional
- [ ] Theme toggle works (light/dark) with no flash
- [ ] All existing routes still accessible after restructure
- [ ] `pnpm tsc --noEmit` passes with zero errors
- [ ] `pnpm build` passes with zero errors and zero warnings
- [ ] Manual smoke test: login → dashboard (EN, IDR) → switch to ID locale → switch to USD → toggle dark mode → visit settings → change FX override