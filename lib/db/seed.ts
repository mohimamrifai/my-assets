import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { db } from "./index";
import { assets, valuations } from "./schema";
import { auth } from "../auth";

const seedAssets = [
  {
    name: "BBCA",
    type: "SAHAM" as const,
    mode: "INVESTING" as const,
    quantity: 10,
    buyPrice: 9200,
    buyDate: new Date("2024-01-15"),
    initialCapital: null,
    platformName: null,
  },
  {
    name: "Bitcoin",
    type: "CRYPTO" as const,
    mode: "INVESTING" as const,
    quantity: 0.005,
    buyPrice: 850000000,
    buyDate: new Date("2024-03-01"),
    initialCapital: null,
    platformName: null,
  },
  {
    name: "Emas LM Antam",
    type: "EMAS" as const,
    mode: "INVESTING" as const,
    quantity: 5,
    buyPrice: 1050000,
    buyDate: new Date("2023-12-01"),
    initialCapital: null,
    platformName: null,
  },
  {
    name: "Binance Futures",
    type: "CRYPTO" as const,
    mode: "TRADING" as const,
    platformName: "Binance",
    initialCapital: 5000000,
    quantity: null,
    buyPrice: null,
    buyDate: null,
  },
];

async function seed() {
  console.log("🌱 Seeding database...");
  try {
    console.log("Creating admin user...");
    await auth.api.signUpEmail({
      body: {
        email: "admin@myassets.com",
        password: "password123",
        name: "Admin User",
      }
    });
    console.log("Admin user created: admin@myassets.com / password123");

    for (const asset of seedAssets) {
      const [newAsset] = await db.insert(assets).values(asset).returning();
      
      let initialValue = 0;
      if (asset.mode === "INVESTING") {
        if (asset.type === "SAHAM") {
          initialValue = (asset.quantity || 0) * 100 * (asset.buyPrice || 0);
        } else {
          initialValue = (asset.quantity || 0) * (asset.buyPrice || 0);
        }
      } else if (asset.mode === "TRADING") {
        initialValue = asset.initialCapital || 0;
      }

      await db.insert(valuations).values({
        assetId: newAsset.id,
        value: initialValue,
        recordedAt: asset.buyDate || new Date(),
        notes: "Initial valuation",
      });
    }
    console.log("✅ Seeding completed!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
  }
  process.exit(0);
}

seed();
