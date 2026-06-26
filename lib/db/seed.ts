import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { db } from "./index";
import { assets, valuations, transactions, user } from "./schema";
import { auth } from "../auth";
import { eq, not } from "drizzle-orm";

const assetTypes = ["SAHAM", "CRYPTO", "EMAS", "REKSA_DANA", "P2P", "LAINNYA"] as const;
const assetModes = ["INVESTING", "TRADING"] as const;

const realisticNames: Record<string, string[]> = {
  SAHAM: ["BBCA (Bank Central Asia)", "BBRI (Bank Rakyat Indonesia)", "TLKM (Telkom Indonesia)", "GOTO (GoTo Gojek Tokopedia)"],
  CRYPTO: ["Bitcoin (BTC)", "Ethereum (ETH)", "Solana (SOL)", "Binance Coin (BNB)"],
  EMAS: ["Emas Antam 1g", "Emas Digital Pluang", "Tabungan Emas Pegadaian"],
  REKSA_DANA: ["Sucorinvest Equity Fund", "Bahana Dana Likuid", "Syailendra Pendapatan Tetap"],
  P2P: ["KoinBisnis (KoinWorks)", "Invoice Financing (Akseleran)", "Microfinance (Amartha)"],
  LAINNYA: ["Sukuk Ritel SR018", "Deposito BCA", "Obligasi FR0090"]
};

const realisticPlatforms: Record<string, string[]> = {
  SAHAM: ["Stockbit", "Ajaib", "IPOT", "Mandiri Sekuritas"],
  CRYPTO: ["Tokocrypto", "Indodax", "Pintu", "Pluang"],
  EMAS: ["Pegadaian", "Pluang", "Treasury"],
  REKSA_DANA: ["Bibit", "Bareksa", "Ajaib Reksa Dana"],
  P2P: ["KoinWorks", "Akseleran", "Amartha"],
  LAINNYA: ["BCA", "Bank Mandiri", "Kemenkeu"]
};

function getPastDate(monthsAgo: number) {
  const date = new Date();
  date.setMonth(date.getMonth() - monthsAgo);
  return date;
}

async function seed() {
  console.log("🌱 Starting High-Volatility Dashboard Seed...");
  try {
    // Setup Admin
    try {
      await auth.api.signUpEmail({ body: { email: "admin@portolook.com", password: "password123", name: "Admin User" } });
    } catch { /* Ignore */ }

    let adminUser = await db.query.user.findFirst({ where: (users, { eq }) => eq(users.email, "admin@portolook.com") });
    if (!adminUser) {
      const [u] = await db.insert(user).values({ id: crypto.randomUUID(), name: "Admin User", email: "admin@portolook.com", emailVerified: true, currency: "IDR" }).returning();
      adminUser = u;
    }

    await db.delete(transactions);
    await db.delete(valuations);
    await db.delete(assets);
    await db.delete(user).where(not(eq(user.email, "admin@portolook.com")));

    for (let i = 1; i <= 15; i++) {
      const type = assetTypes[Math.floor(Math.random() * assetTypes.length)];
      const mode = assetModes[Math.floor(Math.random() * assetModes.length)];
      const name = realisticNames[type][Math.floor(Math.random() * realisticNames[type].length)];
      const platform = realisticPlatforms[type][Math.floor(Math.random() * realisticPlatforms[type].length)];
      
      const isNominal = (type === "REKSA_DANA" || type === "P2P" || type === "LAINNYA");
      const qty = isNominal ? null : (Math.random() * 50 + 1);
      const price = isNominal ? null : (Math.random() * 100000 + 1000);
      const initialCapital = isNominal ? (Math.random() * 50000000 + 5000000) : (qty! * price!);

      const isSold = Math.random() < 0.2; 
      const monthsActive = Math.floor(Math.random() * 11) + 1;
      const buyDate = getPastDate(monthsActive);

      const [newAsset] = await db.insert(assets).values({
        userId: adminUser!.id,
        name: name, type, mode, isNominal, quantity: qty, buyPrice: price, buyDate,
        platformName: platform, initialCapital: initialCapital, status: isSold ? "SOLD" : "ACTIVE"
      }).returning();

      await db.insert(transactions).values({
        assetId: newAsset.id, type: isNominal ? "DEPOSIT" : "BUY", amount: initialCapital,
        quantity: qty, price: price, date: buyDate, fundSource: "Bank Transfer"
      });

      // --- PERBAIKAN VOLATILITAS ---
      let currentValue = initialCapital;
      let historyDate = new Date(buyDate);
      
      for (let m = 0; m <= monthsActive; m++) {
        await db.insert(valuations).values({
          assetId: newAsset.id, value: currentValue, recordedAt: new Date(historyDate)
        });
        
        // VOLATILITAS TINGGI: -15% sampai +20% per bulan
        const volatility = 0.35; 
        const drift = 0.05; // Kecenderungan naik (bullish)
        const monthlyDrift = 1 + (Math.random() * volatility - (volatility / 2) + drift);
        currentValue = currentValue * monthlyDrift;
        historyDate.setMonth(historyDate.getMonth() + 1);
      }

      if (isSold) {
        await db.insert(transactions).values({
          assetId: newAsset.id, type: isNominal ? "WITHDRAWAL" : "SELL", amount: currentValue,
          quantity: qty, price: price, realizedGain: currentValue - initialCapital, date: new Date()
        });
        await db.insert(valuations).values({ assetId: newAsset.id, value: 0, recordedAt: new Date() });
      }
    }
    console.log("✅ Seed completed with high-volatility data!");
  } catch (e) { console.error(e); }
  process.exit(0);
}

seed();