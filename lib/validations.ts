import { z } from "zod";

export const createAssetSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["SAHAM", "CRYPTO", "EMAS"]),
  mode: z.enum(["INVESTING", "TRADING"]),
  notes: z.string().optional(),
  
  quantity: z.number().positive().optional(),
  buyPrice: z.number().positive().optional(),
  buyDate: z.coerce.date().optional(),
  
  platformName: z.string().optional(),
  initialCapital: z.number().positive().optional(),
});

export const updateAssetSchema = createAssetSchema.partial().extend({
  id: z.string(),
});

export const createValuationSchema = z.object({
  value: z.number().positive("Value must be positive"),
  recordedAt: z.coerce.date(),
  notes: z.string().optional(),
});
