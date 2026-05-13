# CLAUDE.md — MyAssets Project

> Dokumen ini adalah panduan utama untuk Claude Code dalam mengerjakan proyek **MyAssets**: aplikasi web pencatatan dan pemantauan perkembangan aset pribadi (Saham, Crypto, Emas).

---

## 🗂️ PROJECT OVERVIEW

**Nama Proyek:** MyAssets  
**Tipe:** Full-stack Web Application  
**Tech Stack:** Next.js 14 (App Router) + Better Auth + Drizzle ORM + PostgreSQL  
**Currency:** IDR (Rupiah) — satu-satunya mata uang yang digunakan  
**User:** Single user dengan autentikasi via Better Auth  
**Platform:** Web App (Desktop-first, responsif)  
**Harga Aset:** Input manual (tidak ada integrasi API harga eksternal)

---

## 🏗️ TECH STACK & TOOLING

| Layer | Teknologi |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Component Library | shadcn/ui |
| Icons | Lucide React |
| Auth | Better Auth |
| Database ORM | Drizzle ORM |
| Database | PostgreSQL |
| Charts | Recharts |
| Form Handling | React Hook Form + Zod |
| State Management | Zustand (jika diperlukan) |
| Date Handling | date-fns |
| Formatting | Prettier + ESLint |

---

## 📁 STRUKTUR FOLDER

```
myassets/
├── app/
│   ├── layout.tsx                  # Root layout
│   ├── page.tsx                    # Dashboard (/)
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx            # Halaman login
│   │   └── layout.tsx
│   ├── assets/
│   │   ├── new/
│   │   │   └── page.tsx            # Form tambah aset baru
│   │   └── [id]/
│   │       ├── page.tsx            # Detail aset
│   │       └── update/
│   │           └── page.tsx        # Form update nilai aset
│   └── api/
│       ├── auth/
│       │   └── [...all]/
│       │       └── route.ts        # Better Auth handler
│       ├── assets/
│       │   ├── route.ts            # GET all, POST new asset
│       │   └── [id]/
│       │       ├── route.ts        # GET, PUT, DELETE asset by ID
│       │       └── valuations/
│       │           └── route.ts    # POST new valuation
│       └── dashboard/
│           └── route.ts            # GET aggregated dashboard data
├── components/
│   ├── ui/                         # shadcn/ui components
│   ├── dashboard/
│   │   ├── NetWorthCard.tsx
│   │   ├── GainLossCard.tsx
│   │   ├── FilterTabs.tsx
│   │   ├── SectorBreakdown.tsx
│   │   └── AssetTable.tsx
│   ├── assets/
│   │   ├── AssetForm.tsx           # Form tambah aset (multi-step)
│   │   ├── UpdateValueForm.tsx     # Form update nilai
│   │   ├── AssetDetailHeader.tsx
│   │   ├── PerformanceChart.tsx    # Line chart tren nilai aset
│   │   └── TransactionTable.tsx
│   └── shared/
│       ├── CurrencyDisplay.tsx     # Format Rp dengan separator
│       ├── GainLossBadge.tsx       # Badge hijau/merah gain/loss
│       └── PageHeader.tsx
├── lib/
│   ├── auth.ts                     # Better Auth instance & config
│   ├── auth-client.ts              # Better Auth client (untuk komponen)
│   ├── db/
│   │   ├── index.ts                # Drizzle client (koneksi PostgreSQL)
│   │   ├── schema.ts               # Semua tabel Drizzle schema
│   │   └── seed.ts                 # Data dummy untuk development
│   ├── calculations.ts             # Fungsi hitung G/L, total modal
│   ├── formatters.ts               # Format Rupiah, persentase, tanggal
│   └── validations.ts              # Zod schemas
├── drizzle/
│   └── migrations/                 # File migrasi yang di-generate Drizzle Kit
├── drizzle.config.ts               # Konfigurasi Drizzle Kit
├── types/
│   └── index.ts                    # TypeScript types & interfaces
└── hooks/
    ├── useAssets.ts
    └── useDashboard.ts
```

---

## 🗄️ DATABASE SCHEMA (Drizzle ORM)

```ts
// lib/db/schema.ts
import { pgTable, text, real, timestamp, pgEnum } from "drizzle-orm/pg-core";

// Enums
export const assetTypeEnum = pgEnum("asset_type", ["SAHAM", "CRYPTO", "EMAS"]);
export const assetModeEnum = pgEnum("asset_mode", ["INVESTING", "TRADING"]);
export const transactionTypeEnum = pgEnum("transaction_type", [
  "BUY", "SELL", "DEPOSIT", "WITHDRAWAL", "UPDATE",
]);

// Tabel Assets
export const assets = pgTable("assets", {
  id:              text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name:            text("name").notNull(),           // "BBCA", "Bitcoin", "Emas LM"
  type:            assetTypeEnum("type").notNull(),   // SAHAM | CRYPTO | EMAS
  mode:            assetModeEnum("mode").notNull(),   // INVESTING | TRADING
  notes:           text("notes"),

  // Investing fields (null jika mode = TRADING)
  quantity:        real("quantity"),                  // lot / unit / gram
  buyPrice:        real("buy_price"),                 // harga beli per unit
  buyDate:         timestamp("buy_date"),

  // Trading fields (null jika mode = INVESTING)
  platformName:    text("platform_name"),
  initialCapital:  real("initial_capital"),           // modal awal (Rp)

  createdAt:       timestamp("created_at").defaultNow().notNull(),
  updatedAt:       timestamp("updated_at").defaultNow().notNull(),
});

// Tabel Valuations — histori nilai aset dari waktu ke waktu
export const valuations = pgTable("valuations", {
  id:          text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  assetId:     text("asset_id").notNull().references(() => assets.id, { onDelete: "cascade" }),
  value:       real("value").notNull(),               // Nilai total aset dalam IDR
  recordedAt:  timestamp("recorded_at").notNull(),    // Support backdate
  notes:       text("notes"),
  createdAt:   timestamp("created_at").defaultNow().notNull(),
});

// Tabel Transactions — riwayat transaksi per aset
export const transactions = pgTable("transactions", {
  id:          text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  assetId:     text("asset_id").notNull().references(() => assets.id, { onDelete: "cascade" }),
  type:        transactionTypeEnum("type").notNull(),
  amount:      real("amount").notNull(),              // Nominal transaksi (Rp)
  fundSource:  text("fund_source"),                   // Sumber dana (e.g., "Tabungan")
  date:        timestamp("date").notNull(),
  notes:       text("notes"),
  createdAt:   timestamp("created_at").defaultNow().notNull(),
});

// Better Auth akan generate tabel user, session, account, verification secara otomatis
// Lihat lib/auth.ts untuk konfigurasi
```

### Konfigurasi Drizzle Kit

```ts
// drizzle.config.ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

### Setup Better Auth

```ts
// lib/auth.ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  emailAndPassword: { enabled: true },
  // Tambahkan social providers jika diperlukan
});
```

```ts
// lib/auth-client.ts
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
});
```

### Koneksi Database

```ts
// lib/db/index.ts
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });
```

---

## 📐 BUSINESS LOGIC & KALKULASI

### Kalkulasi Modal Awal (Investing)
```
Total Modal = quantity × buyPrice
- Saham   : lot × 100 × harga per lembar
- Crypto  : unit × harga per unit
- Emas    : gram × harga per gram
```

### Kalkulasi Gain/Loss
```
G/L Nominal  = Current Value - Total Modal
G/L Persen   = (G/L Nominal / Total Modal) × 100
```

### Kalkulasi Update Nilai (Investing)
```
- Saham  : new value = lot × 100 × harga per lembar input
- Crypto : new value = unit × harga per unit input
- Emas   : new value = gram × harga per gram input
```

### Kalkulasi Update Nilai (Trading)
```
- Input langsung = saldo akun terkini di platform (Rp)
```

### Dashboard Aggregation
```
Net Worth        = Σ nilai terkini semua aset
Total Modal      = Σ modal awal semua aset
G/L Keseluruhan  = Net Worth - Total Modal
Filter Investing = hanya aset mode INVESTING
Filter Trading   = hanya aset mode TRADING
Breakdown Sektor = groupBy(AssetType) → sum current value
```

---

## 🖥️ HALAMAN & FITUR

### 1. Dashboard (`/`)
- **Net Worth Card**: Total nilai semua aset dalam Rp
- **G/L Card**: Gain/Loss nominal + persentase (warna hijau/merah)
- **Filter Tabs**: Semua | Investing Only | Trading Only
- **Breakdown G/L**: Tabel perbandingan performa Investing vs Trading
- **Ringkasan Sektoral**: Pie/donut chart proporsi Saham / Crypto / Emas
- **Tabel Aset**: List semua aset dengan nilai terkini, G/L, dan link ke detail

### 2. Detail Aset (`/assets/[id]`)
- **Header**: Nama, tipe, mode, tanggal beli/mulai
- **Info Card Investing**: Quantity, harga beli rata-rata, total modal
- **Info Card Trading**: Platform name, modal aktif
- **Performance Card**: Nilai terkini, G/L nominal & persen
- **Chart**: Line chart tren nilai aset dari waktu ke waktu (dari data valuasi)
- **Tabel Histori Valuasi**: Tanggal, nilai, notes
- **Tabel Transaksi**: Tipe, jumlah, sumber dana, tanggal

### 3. Tambah Aset Baru (`/assets/new`)
Multi-step form:
- **Step 1**: Pilih Jenis Aset (Saham / Crypto / Emas)
- **Step 2**: Pilih Mode (INVESTING / TRADING)
- **Step 3**: Input detail sesuai mode:
  - Investing: nama, quantity, harga beli per unit, tanggal, catatan
  - Trading: nama platform, modal awal, nilai saat ini, tanggal, catatan
- **Finalisasi**: Otomatis buat entri valuasi awal

### 4. Update Nilai Aset (`/assets/[id]/update`)
Form update bergantung mode & tipe:
- **Investing Saham**: Input harga per lembar → sistem hitung total
- **Investing Crypto**: Input harga per unit → sistem hitung total
- **Investing Emas**: Input harga per gram → sistem hitung total
- **Trading**: Input langsung nilai saldo akun (Rp)
- **Field tanggal**: Support backdate (default = hari ini)

---

## 🎨 DESIGN SYSTEM

**Tema:** Dark mode, finansial/profesional, bersih dan data-dense  
**Palet Warna:**
```
Background    : #0F1117 (near black)
Surface       : #1A1D2E (dark navy card)
Border        : #2A2D3E
Primary       : #6366F1 (indigo)
Gain (green)  : #22C55E
Loss (red)    : #EF4444
Text Primary  : #F1F5F9
Text Muted    : #64748B
```

**Prinsip UI:**
- Data harus terbaca dengan cepat — gunakan tipografi hierarkis yang jelas
- Warna hijau = positif/gain, merah = negatif/loss — konsisten di seluruh app
- Angka besar dan penting dibuat prominent (font besar, bold)
- Format Rupiah: selalu `Rp 1.234.567` (titik sebagai separator ribuan)
- Persentase: selalu tampilkan tanda `+` untuk positif, `-` untuk negatif

---

## 🧩 UI COMPONENT CONVENTIONS

### Tailwind CSS
- Gunakan Tailwind utility classes secara langsung — tidak ada custom CSS kecuali benar-benar diperlukan
- Gunakan CSS variables Tailwind untuk warna (`bg-background`, `text-foreground`, dll) agar konsisten dengan tema shadcn/ui
- Gunakan `cn()` helper dari `lib/utils.ts` untuk conditional class merging:
  ```ts
  import { cn } from "@/lib/utils";
  <div className={cn("base-class", isActive && "active-class")} />
  ```

### shadcn/ui
- Semua komponen UI primitif (Button, Card, Dialog, Table, Input, Select, Tabs, dll) **wajib** menggunakan shadcn/ui — jangan buat dari scratch
- Install komponen via CLI: `npx shadcn@latest add <component>`
- Komponen shadcn ada di `components/ui/` — **jangan modifikasi langsung**, extend di luar folder tersebut jika perlu kustomisasi
- Komponen shadcn yang pasti dibutuhkan proyek ini:
  ```
  button, card, input, label, select, tabs, table, dialog,
  badge, separator, skeleton, toast, dropdown-menu, form
  ```

### Lucide React
- **Semua icon wajib dari Lucide React** — tidak menggunakan icon library lain
- Import individual untuk tree-shaking optimal:
  ```ts
  // ✅ Benar
  import { TrendingUp, TrendingDown, Plus, Trash2 } from "lucide-react";

  // ❌ Salah
  import * as Icons from "lucide-react";
  ```
- Ukuran icon konsisten: `size={16}` untuk inline, `size={20}` untuk tombol, `size={24}` untuk header
- Selalu pasangkan dengan `aria-hidden` jika dekoratif:
  ```tsx
  <TrendingUp size={16} aria-hidden="true" />
  ```
- Icon yang relevan untuk proyek ini:

  | Konteks | Icon |
  |---|---|
  | Gain / naik | `TrendingUp` |
  | Loss / turun | `TrendingDown` |
  | Tambah aset | `Plus`, `PlusCircle` |
  | Hapus | `Trash2` |
  | Edit / update | `Pencil`, `RefreshCw` |
  | Saham | `BarChart2` |
  | Crypto | `Bitcoin` |
  | Emas | `Gem` |
  | Portfolio / wallet | `Wallet` |
  | Investing | `PiggyBank` |
  | Trading | `ArrowLeftRight` |
  | Tanggal | `Calendar` |
  | Histori | `History` |
  | Detail / info | `Info` |
  | Kembali | `ChevronLeft` |
  | Menu | `MoreHorizontal` |

---

## ✅ CODING CONVENTIONS

1. **TypeScript strict mode** — tidak ada `any` kecuali terpaksa
2. **Server Components by default** — gunakan `'use client'` hanya jika membutuhkan interaktivitas
3. **API Routes di `app/api/`** — semua data fetching lewat API routes atau Server Actions
4. **Auth guard di setiap API route** — selalu validasi sesi dengan Better Auth:
   ```ts
   const session = await auth.api.getSession({ headers: await headers() });
   if (!session) return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
   ```
5. **Drizzle queries** — gunakan `db.query.*` (relational) untuk query dengan relasi, `db.select()` untuk query sederhana. Hindari N+1:
   ```ts
   // ✅ Benar — ambil aset beserta valuasi terbaru sekaligus
   const assets = await db.query.assets.findMany({
     with: { valuations: { orderBy: desc(valuations.recordedAt), limit: 1 } },
   });
   ```
6. **Zod validation** — semua input form divalidasi dengan Zod schema
7. **Error handling** — semua API route harus return response yang konsisten:
   ```ts
   { success: true, data: ... }
   { success: false, error: "pesan error" }
   ```
8. **Format Rupiah** — selalu gunakan helper `formatIDR()` dari `lib/formatters.ts`
9. **Migrasi** — setiap perubahan schema, jalankan `npx drizzle-kit generate` lalu `npx drizzle-kit migrate`
10. **Komponen kecil** — satu komponen = satu tanggung jawab

---

## 🚀 DEVELOPMENT PHASES (Urutan Pengerjaan)

Ikuti urutan ini secara ketat. Selesaikan satu fase sebelum lanjut ke fase berikutnya.

### FASE 1 — Foundation (Setup & Database)
- [ ] Init Next.js 14 project dengan TypeScript
- [ ] Install & konfigurasi Tailwind CSS
- [ ] Install & konfigurasi shadcn/ui (`npx shadcn@latest init`)
- [ ] Install komponen shadcn yang dibutuhkan (button, card, input, label, select, tabs, table, dialog, badge, separator, skeleton, toast, dropdown-menu, form)
- [ ] Install Lucide React (`npm install lucide-react`)
- [ ] Setup PostgreSQL (lokal atau cloud — Supabase/Railway/Neon)
- [ ] Install & konfigurasi Drizzle ORM + `drizzle-kit`
- [ ] Install & konfigurasi Better Auth dengan Drizzle adapter
- [ ] Buat `lib/db/schema.ts` sesuai spesifikasi di atas
- [ ] Jalankan `npx drizzle-kit generate` + `npx drizzle-kit migrate`
- [ ] Setup `app/api/auth/[...all]/route.ts` untuk Better Auth handler
- [ ] Buat halaman login (`/login`) dan middleware proteksi route
- [ ] Buat seed data dummy (`lib/db/seed.ts`)
- [ ] Buat `lib/calculations.ts`, `lib/formatters.ts`, `lib/validations.ts`
- [ ] Buat `types/index.ts` dengan semua TypeScript interfaces

### FASE 2 — API Layer
- [ ] `GET /api/assets` — ambil semua aset dengan valuasi terkini
- [ ] `POST /api/assets` — tambah aset baru + buat valuasi awal
- [ ] `GET /api/assets/[id]` — detail aset + semua valuasi + transaksi
- [ ] `PUT /api/assets/[id]` — edit data aset
- [ ] `DELETE /api/assets/[id]` — hapus aset
- [ ] `POST /api/assets/[id]/valuations` — tambah valuasi baru (update nilai)
- [ ] `GET /api/dashboard` — data agregasi untuk dashboard

### FASE 3 — Dashboard UI
- [ ] Layout utama (sidebar/navbar + content area)
- [ ] `NetWorthCard` component
- [ ] `GainLossCard` component (dengan warna kondisional)
- [ ] `FilterTabs` component (Semua / Investing / Trading)
- [ ] `SectorBreakdown` — donut chart Saham/Crypto/Emas
- [ ] `AssetTable` — tabel daftar aset di dashboard

### FASE 4 — Form Tambah Aset
- [ ] Multi-step form dengan state management
- [ ] Step 1: Pilih tipe aset
- [ ] Step 2: Pilih mode (Investing/Trading)
- [ ] Step 3: Input detail + kalkulasi otomatis total modal
- [ ] Validasi dengan Zod + React Hook Form
- [ ] Submit → create asset + create initial valuation

### FASE 5 — Halaman Detail Aset
- [ ] `AssetDetailHeader` — nama, tipe, mode, tanggal
- [ ] Info card kondisional (Investing vs Trading)
- [ ] `PerformanceChart` — line chart tren nilai (Recharts)
- [ ] `TransactionTable` — histori transaksi
- [ ] Valuation history table

### FASE 6 — Form Update Nilai
- [ ] Form adaptif berdasarkan tipe + mode aset
- [ ] Kalkulasi otomatis nilai total (untuk Investing)
- [ ] Input langsung saldo (untuk Trading)
- [ ] Field tanggal dengan support backdate
- [ ] Submit → create new valuation record

### FASE 7 — Polish & QA
- [ ] Responsive design check (tablet + mobile)
- [ ] Loading states dan error states di semua halaman
- [ ] Empty states (saat belum ada aset)
- [ ] Konfirmasi sebelum hapus aset
- [ ] Cek semua kalkulasi dengan data edge case

---

## ⚠️ ATURAN PENTING UNTUK CLAUDE

1. **Jangan skip fase** — kerjakan Foundation dulu sebelum UI
2. **Selalu tanya sebelum ambil keputusan arsitektur besar** yang tidak tercantum di dokumen ini
3. **Ikuti schema Drizzle** yang sudah didefinisikan — jangan modifikasi tanpa konfirmasi. Setiap perubahan harus lewat `drizzle-kit generate` + `drizzle-kit migrate`
4. **Semua angka finansial disimpan sebagai `real` (Float)** di database (IDR)
5. **Semua API route harus diproteksi** dengan pengecekan sesi Better Auth — tidak ada endpoint publik kecuali `/api/auth/*`
6. **Jangan generate Better Auth schema manual** — biarkan Better Auth + Drizzle adapter yang generate tabel `user`, `session`, `account`, `verification` otomatis
7. **Tidak ada API harga eksternal** — semua nilai diinput manual oleh user
8. **Backup data** — pastikan ada konfirmasi sebelum operasi destruktif (hapus aset)
9. **Konsisten dengan design system** — warna gain/loss, format Rupiah, dll harus sama di semua tempat
10. **Environment variables yang dibutuhkan:**
    ```
    DATABASE_URL=postgresql://...
    BETTER_AUTH_SECRET=...
    NEXT_PUBLIC_APP_URL=http://localhost:3000
    ```

---

## 📝 CONTOH DATA (untuk Seed)

```ts
// Contoh aset untuk testing
const seedAssets = [
  {
    name: "BBCA",
    type: "SAHAM",
    mode: "INVESTING",
    quantity: 10,      // 10 lot
    buyPrice: 9200,    // Rp 9.200 per lembar
    buyDate: "2024-01-15",
    // Total Modal = 10 × 100 × 9200 = Rp 9.200.000
  },
  {
    name: "Bitcoin",
    type: "CRYPTO",
    mode: "INVESTING",
    quantity: 0.005,   // 0.005 BTC
    buyPrice: 850000000, // Rp 850.000.000 per BTC
    buyDate: "2024-03-01",
    // Total Modal = 0.005 × 850.000.000 = Rp 4.250.000
  },
  {
    name: "Emas LM Antam",
    type: "EMAS",
    mode: "INVESTING",
    quantity: 5,       // 5 gram
    buyPrice: 1050000, // Rp 1.050.000 per gram
    buyDate: "2023-12-01",
    // Total Modal = 5 × 1.050.000 = Rp 5.250.000
  },
  {
    name: "Binance Futures",
    type: "CRYPTO",
    mode: "TRADING",
    platformName: "Binance",
    initialCapital: 5000000, // Rp 5.000.000
    // Nilai terkini diinput manual
  },
]
```

---

*Dokumen ini harus selalu menjadi referensi utama selama pengerjaan proyek MyAssets. Update dokumen ini jika ada perubahan keputusan arsitektur yang disepakati.*
