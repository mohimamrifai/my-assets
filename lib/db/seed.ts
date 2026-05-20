import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { db } from "./index";
import { assets, valuations, transactions, user } from "./schema";
import { auth } from "../auth";

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

    // Clear existing data for a clean slate
    await db.delete(transactions);
    await db.delete(valuations);
    await db.delete(assets);

    console.log("✅ Database reset & Admin seed completed! Clean slate ready.");
  } catch (error) {
    console.error("Seeding failed:");
    console.error(error);
  }
  process.exit(0);
}

seed();
