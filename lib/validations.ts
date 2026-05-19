import { z } from "zod";

const baseAssetSchema = z.object({
  name: z.string().min(1, "Name is required").or(z.string().length(0).optional()),
  type: z.enum(["SAHAM", "CRYPTO", "EMAS", "REKSA_DANA", "P2P", "LAINNYA"]),
  mode: z.enum(["INVESTING", "TRADING"]),
  notes: z.string().optional(),
  fundSource: z.string().optional(),
  
  isNominal: z.boolean().default(false),
  quantity: z.number().min(0).optional(),
  buyPrice: z.number().min(0).optional(),
  buyDate: z.coerce.date().optional(),
  
  platformName: z.string().optional(),
  initialCapital: z.number().min(0).optional(),
});

export const createAssetSchema = baseAssetSchema.refine(data => {
  if (data.mode === "INVESTING" && !data.name) {
    return false;
  }
  return true;
}, {
  message: "Nama aset wajib diisi untuk mode Investing",
  path: ["name"]
}).refine(data => {
  if (data.mode === "TRADING" && !data.platformName) {
    return false;
  }
  return true;
}, {
  message: "Nama platform wajib diisi untuk mode Trading",
  path: ["platformName"]
}).refine(data => {
  if (data.mode === "INVESTING") {
    return data.isNominal === false;
  }
  return true;
}, {
  message: "Pencatatan Nominal/Kas dinonaktifkan sesuai revisi",
  path: ["isNominal"]
}).refine(data => {
  if (data.mode === "INVESTING" && !data.isNominal) {
    return data.quantity !== undefined && data.quantity > 0;
  }
  return true;
}, {
  message: "Kuantitas wajib diisi",
  path: ["quantity"]
}).refine(data => {
  if (data.mode === "INVESTING" && !data.isNominal) {
    return data.buyPrice !== undefined && data.buyPrice >= 0;
  }
  return true;
}, {
  message: "Harga beli wajib diisi",
  path: ["buyPrice"]
}).refine(data => {
  if (data.mode === "TRADING") {
    return data.initialCapital !== undefined && data.initialCapital > 0;
  }
  return true;
}, {
  message: "Nominal modal wajib diisi",
  path: ["initialCapital"]
});

export const updateAssetSchema = baseAssetSchema.partial().extend({
  id: z.string(),
});

export const createValuationSchema = z.object({
  value: z.number().positive("Value must be positive"),
  recordedAt: z.coerce.date(),
  fundSource: z.string().optional(),
  notes: z.string().optional(),
});

export const createTransactionSchema = z.object({
  type: z.enum(["DEPOSIT", "WITHDRAWAL"]),
  amount: z.number().positive("Jumlah harus lebih dari 0"),
  date: z.coerce.date(),
  fundSource: z.string().optional(),
  notes: z.string().optional(),
});

export const editTransactionSchema = z.object({
  type: z.enum(["BUY", "SELL", "DEPOSIT", "WITHDRAWAL", "UPDATE"]),
  amount: z.number().min(0, "Jumlah tidak boleh negatif"),
  date: z.coerce.date(),
  fundSource: z.string().optional(),
  notes: z.string().optional(),
});
