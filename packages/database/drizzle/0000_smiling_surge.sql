CREATE TABLE "docs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usersClerkId" varchar(256),
	"docName" varchar(150),
	"description" varchar(256),
	CONSTRAINT "docs_docName_unique" UNIQUE("docName")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerkId" varchar(256),
	"username" varchar(256),
	"email" varchar(256),
	CONSTRAINT "users_clerkId_unique" UNIQUE("clerkId"),
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "docs" ADD CONSTRAINT "docs_usersClerkId_users_clerkId_fk" FOREIGN KEY ("usersClerkId") REFERENCES "public"."users"("clerkId") ON DELETE no action ON UPDATE no action;