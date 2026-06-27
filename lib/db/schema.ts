import { relations } from "drizzle-orm";
import { pgTable, text, real, timestamp, pgEnum, boolean, index } from "drizzle-orm/pg-core";

export const assetTypeEnum = pgEnum("asset_type", ["SAHAM", "CRYPTO", "EMAS", "REKSA_DANA", "P2P", "LAINNYA"]);
export const assetModeEnum = pgEnum("asset_mode", ["INVESTING", "TRADING"]);
export const transactionTypeEnum = pgEnum("transaction_type", [
  "BUY", "SELL", "DEPOSIT", "WITHDRAWAL", "UPDATE",
]);

export const assets = pgTable("assets", {
  id:              text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId:          text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  name:            text("name").notNull(),
  type:            assetTypeEnum("type").notNull(),
  mode:            assetModeEnum("mode").notNull(),
  notes:           text("notes"),
  
  isNominal:       boolean("is_nominal").default(false).notNull(), // TRUE if invested by flat nominal instead of quantity

  quantity:        real("quantity"),
  buyPrice:        real("buy_price"),
  buyDate:         timestamp("buy_date"),

  platformName:    text("platform_name"),
  initialCapital:  real("initial_capital"), // Also used for Nominal Investing to store the capital amount

  status:          text("status").default("ACTIVE").notNull(), // ACTIVE, SOLD

  createdAt:       timestamp("created_at").defaultNow().notNull(),
  updatedAt:       timestamp("updated_at").defaultNow().notNull(),
});

export const valuations = pgTable("valuations", {
  id:          text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  assetId:     text("asset_id").notNull().references(() => assets.id, { onDelete: "cascade" }),
  value:       real("value").notNull(),
  recordedAt:  timestamp("recorded_at").notNull(),
  notes:       text("notes"),
  createdAt:   timestamp("created_at").defaultNow().notNull(),
});

export const transactions = pgTable("transactions", {
  id:          text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  assetId:     text("asset_id").notNull().references(() => assets.id, { onDelete: "cascade" }),
  type:        transactionTypeEnum("type").notNull(),
  amount:      real("amount").notNull(),
  quantity:    real("quantity"), // New: how many units were transacted (for SELL)
  price:       real("price"),    // New: price per unit at transaction
  realizedGain: real("realized_gain"), // New: for SELL transactions
  fundSource:  text("fund_source"),
  date:        timestamp("date").notNull(),
  notes:       text("notes"),
  createdAt:   timestamp("created_at").defaultNow().notNull(),
});

export const assetsRelations = relations(assets, ({ many }) => ({
  valuations: many(valuations),
  transactions: many(transactions),
}));

export const valuationsRelations = relations(valuations, ({ one }) => ({
  asset: one(assets, {
    fields: [valuations.assetId],
    references: [assets.id],
  }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  asset: one(assets, {
    fields: [transactions.assetId],
    references: [assets.id],
  }),
}));


export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  currency: text("currency").default("IDR").notNull(),
  locale: text("locale").default("en").notNull(),
  fxRateOverride: real("fx_rate_override"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  assets: many(assets),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));
