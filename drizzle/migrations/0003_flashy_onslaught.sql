ALTER TABLE "assets" ADD COLUMN "user_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "investing_cash" ADD COLUMN "user_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "investing_cash_transactions" ADD COLUMN "user_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investing_cash" ADD CONSTRAINT "investing_cash_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investing_cash_transactions" ADD CONSTRAINT "investing_cash_transactions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;