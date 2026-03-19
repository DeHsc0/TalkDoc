CREATE TABLE "chats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usersClerkId" varchar(256) NOT NULL,
	"docId" uuid NOT NULL,
	"aiResponse" varchar NOT NULL,
	"usersResponse" varchar(256) NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "docs" RENAME COLUMN "docName" TO "title";--> statement-breakpoint
ALTER TABLE "docs" RENAME COLUMN "created_at" TO "createdAt";--> statement-breakpoint
ALTER TABLE "users" RENAME COLUMN "username" TO "userName";--> statement-breakpoint
ALTER TABLE "users" RENAME COLUMN "created_at" TO "createdAt";--> statement-breakpoint
ALTER TABLE "users" RENAME COLUMN "updated_at" TO "updatedAt";--> statement-breakpoint
ALTER TABLE "docs" DROP CONSTRAINT "docs_docName_unique";--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_username_unique";--> statement-breakpoint
ALTER TABLE "docs" ADD COLUMN "pages" integer;--> statement-breakpoint
ALTER TABLE "docs" ADD COLUMN "size" varchar(4);--> statement-breakpoint
ALTER TABLE "chats" ADD CONSTRAINT "chats_usersClerkId_users_clerkId_fk" FOREIGN KEY ("usersClerkId") REFERENCES "public"."users"("clerkId") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chats" ADD CONSTRAINT "chats_docId_docs_id_fk" FOREIGN KEY ("docId") REFERENCES "public"."docs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_userName_unique" UNIQUE("userName");