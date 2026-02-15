ALTER TABLE "docs" ALTER COLUMN "usersClerkId" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "docs" ALTER COLUMN "docName" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "docs" ALTER COLUMN "description" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "clerkId" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "username" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "email" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "docs" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;