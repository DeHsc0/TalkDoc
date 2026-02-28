
import { pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const users = pgTable('users', {
    id : uuid("id").primaryKey().defaultRandom().notNull(),
    clerkId : varchar("clerkId" , {length : 256}).unique().notNull(),
    username : varchar("username" , { length : 256 }).unique().notNull(),
    email : varchar("email" , { length : 256 }).unique().notNull(),
    createdAt: timestamp("created_at" , { withTimezone : true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at" , { withTimezone : true }).defaultNow().notNull()
})

export const docs = pgTable( "docs" , {
    id : uuid("id").primaryKey().defaultRandom().notNull(),
    usersClerkId : varchar("usersClerkId", { length: 256 }).references(() => users.clerkId).notNull(),
    docName : varchar("docName" , { length : 150 }).notNull(),
    description : varchar("description" , { length : 256 }),
    createdAt: timestamp("created_at").defaultNow().notNull()
})