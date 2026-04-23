CREATE TABLE IF NOT EXISTS "users" (
	"wallet_address" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
