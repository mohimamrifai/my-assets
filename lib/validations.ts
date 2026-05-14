import { z } from "zod";

const baseAssetSchema = z.object({
  name: z.string().min(1, "Name is required").or(z.string().length(0).optional()),
  type: z.enum(["SAHAM", "CRYPTO", "EMAS"]),
  mode: z.enum(["INVESTING", "TRADING"]),
  notes: z.string().optional(),
  
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
});

export const updateAssetSchema = baseAssetSchema.partial().extend({
  id: z.string(),
});

export const createValuationSchema = z.object({
  value: z.number().positive("Value must be positive"),
  recordedAt: z.coerce.date(),
  notes: z.string().optional(),
});
