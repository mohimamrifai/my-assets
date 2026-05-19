import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { db } from "./index";
import { assets, valuations, transactions, user } from "./schema";
import { auth } from "../auth";
import { subDays } from "date-fns";

const seedAssets = [
  {
    name: "BBCA - Bank Central Asia",
    type: "SAHAM" as const,
    mode: "INVESTING" as const,
    quantity: 15,
    buyPrice: 8500,
    buyDate: subDays(new Date(), 40),
    initialCapital: null,
    platformName: "Stockbit",
  },
  {
    name: "Ethereum",
    type: "CRYPTO" as const,
    mode: "INVESTING" as const,
    quantity: 1.25,
    buyPrice: 35000000,
    buyDate: subDays(new Date(), 60),
    initialCapital: null,
    platformName: "Indodax",
  },
  {
    name: "Emas LM Antam",
    type: "EMAS" as const,
    mode: "INVESTING" as const,
    quantity: 20,
    buyPrice: 1100000,
    buyDate: subDays(new Date(), 90),
    initialCapital: null,
    platformName: "Pegadaian",
  },
  {
    name: "Binance Futures - Scalping",
    type: "CRYPTO" as const,
    mode: "TRADING" as const,
    platformName: "Binance",
    initialCapital: 10000000,
    quantity: null,
    buyPrice: null,
    buyDate: null,
  },
];

async function seed() {
  console.log("🌱 Seeding database...");
  try {
    // We don't need to create admin user again if it already exists, let's catch the error gracefully
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
    } catch {
      console.log("Admin user creation error caught, proceeding...");
    }

    let adminUser = await db.query.user.findFirst({
      where: (users, { eq }) => eq(users.email, "admin@myassets.com")
    });

    if (!adminUser) {
      console.log("Admin user might already exist, proceeding...");
      // Let's create an explicit admin user record if BetterAuth hasn't
      // In seed script context, we might need a raw DB insert for the user if auth isn't fully working
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const userResult: any = await db.insert(user).values({
        id: crypto.randomUUID(),
        name: "Admin User",
        email: "admin@myassets.com",
        emailVerified: true,
        currency: "IDR"
      }).returning();
      adminUser = userResult[0];
    }

    const userId = adminUser!.id;

    // Clear existing data for a clean slate
    await db.delete(transactions);
    await db.delete(valuations);
    await db.delete(assets);

    const now = new Date();

    for (const asset of seedAssets) {
      const [newAsset] = await db.insert(assets).values({ ...asset, userId }).returning();
      
      let initialValue = 0;
      let multiplier = 1;
      
      if (asset.mode === "INVESTING") {
        if (asset.type === "SAHAM") {
          multiplier = 100;
        }
        initialValue = (asset.quantity || 0) * multiplier * (asset.buyPrice || 0);
      } else if (asset.mode === "TRADING") {
        initialValue = asset.initialCapital || 0;
      }

      const startDate = asset.buyDate || subDays(now, 30);

      // Generate initial valuation
      await db.insert(valuations).values({
        assetId: newAsset.id,
        value: initialValue,
        recordedAt: startDate,
        notes: "Modal Awal",
      });

      // Generate Initial Transaction
      await db.insert(transactions).values({
        assetId: newAsset.id,
        type: asset.mode === "INVESTING" ? "BUY" : "DEPOSIT",
        amount: initialValue,
        date: startDate,
        notes: asset.mode === "INVESTING" ? `Pembelian ${asset.quantity} ${asset.type === 'SAHAM' ? 'Lot' : 'Unit'}` : "Setor Modal Awal",
        fundSource: "Bank BCA",
      });

      // Generate a rich history of valuations (last 30 days)
      let currentValue = initialValue;
      for (let i = 29; i >= 0; i--) {
        const recordDate = subDays(now, i);
        
        // Random daily fluctuation (-2% to +2.5%)
        const fluctuation = (Math.random() * 0.045) - 0.02; 
        currentValue = currentValue + (currentValue * fluctuation);

        await db.insert(valuations).values({
          assetId: newAsset.id,
          value: Math.round(currentValue),
          recordedAt: recordDate,
          notes: i === 0 ? "Valuasi Terkini" : "Update harian",
        });

        // Add a random transaction occasionally
        if (i === 15 || i === 5) {
          const isDeposit = Math.random() > 0.5;
          const amount = Math.round(initialValue * 0.1); // 10% of initial
          
          await db.insert(transactions).values({
            assetId: newAsset.id,
            type: asset.mode === "INVESTING" ? (isDeposit ? "BUY" : "SELL") : (isDeposit ? "DEPOSIT" : "WITHDRAWAL"),
            amount: amount,
            date: recordDate,
            notes: isDeposit ? "Top up rutin" : "Penarikan sebagian",
            fundSource: "Saldo Trading",
          });
          
          // adjust current value based on transaction
          if (isDeposit) currentValue += amount;
          else currentValue -= amount;
        }
      }
    }
    console.log("✅ Seeding completed! Database is now populated with rich chart data and transactions.");
  } catch (error) {
    console.error("Seeding failed:");
    console.error(error);
  }
  process.exit(0);
}

seed();
