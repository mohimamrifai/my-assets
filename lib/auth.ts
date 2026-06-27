import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  emailAndPassword: { enabled: true },
  user: {
    additionalFields: {
      currency: {
        type: "string",
        required: false,
        defaultValue: "IDR",
      },
      locale: {
        type: "string",
        required: false,
        defaultValue: "en",
      },
      fxRateOverride: {
        type: "number",
        required: false,
      },
    },
  },
});
