CREATE TYPE "public"."cash_transaction_type" AS ENUM('DEPOSIT', 'WITHDRAWAL', 'BUY_ASSET', 'SELL_ASSET');--> statement-breakpoint
ALTER TYPE "public"."asset_type" ADD VALUE 'REKSA_DANA';--> statement-breakpoint
ALTER TYPE "public"."asset_type" ADD VALUE 'P2P';--> statement-breakpoint
ALTER TYPE "public"."asset_type" ADD VALUE 'LAINNYA';--> statement-breakpoint
CREATE TABLE "investing_cash" (
	"id" text PRIMARY KEY NOT NULL,
	"balance" real DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "investing_cash_transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"type" "cash_transaction_type" NOT NULL,
	"amount" real NOT NULL,
	"reference_id" text,
	"date" timestamp NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "is_nominal" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "status" text DEFAULT 'ACTIVE' NOT NULL;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "quantity" real;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "price" real;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "realized_gain" real;