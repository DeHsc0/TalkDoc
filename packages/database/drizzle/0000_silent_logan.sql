CREATE TABLE "chats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usersClerkId" varchar(256) NOT NULL,
	"conversationId" uuid NOT NULL,
	"aiResponse" varchar NOT NULL,
	"usersResponse" varchar(600) NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usersClerkId" varchar(256) NOT NULL,
	"docId" uuid NOT NULL,
	"title" varchar(150) NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "docs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usersClerkId" varchar(256) NOT NULL,
	"title" varchar(150) NOT NULL,
	"description" varchar(256),
	"url" varchar(500),
	"pages" integer,
	"size" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerkId" varchar(256) NOT NULL,
	"userName" varchar(256) NOT NULL,
	"email" varchar(256) NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_clerkId_unique" UNIQUE("clerkId"),
	CONSTRAINT "users_userName_unique" UNIQUE("userName"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "chats" ADD CONSTRAINT "chats_usersClerkId_users_clerkId_fk" FOREIGN KEY ("usersClerkId") REFERENCES "public"."users"("clerkId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chats" ADD CONSTRAINT "chats_conversationId_conversations_id_fk" FOREIGN KEY ("conversationId") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_usersClerkId_users_clerkId_fk" FOREIGN KEY ("usersClerkId") REFERENCES "public"."users"("clerkId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_docId_docs_id_fk" FOREIGN KEY ("docId") REFERENCES "public"."docs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "docs" ADD CONSTRAINT "docs_usersClerkId_users_clerkId_fk" FOREIGN KEY ("usersClerkId") REFERENCES "public"."users"("clerkId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chats_users_clerk_id_idx" ON "chats" USING btree ("usersClerkId");--> statement-breakpoint
CREATE INDEX "chats_conversation_id_idx" ON "chats" USING btree ("conversationId");--> statement-breakpoint
CREATE INDEX "conversations_users_clerk_id_idx" ON "conversations" USING btree ("usersClerkId");--> statement-breakpoint
CREATE INDEX "conversations_doc_id_idx" ON "conversations" USING btree ("docId");--> statement-breakpoint
CREATE INDEX "docs_users_clerk_id_idx" ON "docs" USING btree ("usersClerkId");