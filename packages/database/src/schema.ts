
import { index, integer, pgTable, timestamp, uuid, varchar, decimal } from "drizzle-orm/pg-core";

export const users = pgTable('users', {
    id : uuid("id").primaryKey().defaultRandom().notNull(),
    clerkId : varchar("clerkId" , {length : 256}).unique().notNull(),
    userName : varchar("userName" , { length : 256 }).unique().notNull(),
    email : varchar("email" , { length : 256 }).unique().notNull(),
    createdAt: timestamp("createdAt" , { withTimezone : true }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt" , { withTimezone : true }).defaultNow().notNull()
})

export const docs = pgTable( "docs" , {
    id : uuid("id").primaryKey().defaultRandom().notNull(),
    usersClerkId : varchar("usersClerkId", { length: 256 }).references(() => users.clerkId , { onDelete : "cascade"}).notNull(),
    title : varchar("title" , { length : 150 }).notNull(),
    description : varchar("description" , { length : 256 }),
    url : varchar("url" , {length : 500}),
    pages : integer("pages"),
    size : decimal( "size" ),
    createdAt: timestamp("createdAt").defaultNow().notNull()
} , (table) => [ index("docs_users_clerk_id_idx").on(table.usersClerkId)])

export const conversations  = pgTable( "conversations" , {

    id : uuid("id").primaryKey().defaultRandom().notNull(),
    usersClerkId : varchar("usersClerkId", { length: 256 }).references(() => users.clerkId , { onDelete : "cascade"}).notNull(),
    docId : uuid("docId").references(() => docs.id , { onDelete : "cascade"}).notNull(),
    title : varchar("title" , { length : 150 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull()
} , (table) => [
  index("conversations_users_clerk_id_idx").on(table.usersClerkId),
  index("conversations_doc_id_idx").on(table.docId),
])

export const chats = pgTable( "chats" , {

    id : uuid("id").primaryKey().defaultRandom().notNull(),
    usersClerkId : varchar("usersClerkId", { length: 256 }).references(() => users.clerkId , { onDelete : "cascade"}).notNull(),
    conversationId : uuid("conversationId").references(() => conversations.id , { onDelete : "cascade"}).notNull(),
    aiResponse :  varchar("aiResponse").notNull(),
    usersResponse : varchar("usersResponse" , { length : 600 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull()
} , (table) => [
  index("chats_users_clerk_id_idx").on(table.usersClerkId),
  index("chats_conversation_id_idx").on(table.conversationId),
])