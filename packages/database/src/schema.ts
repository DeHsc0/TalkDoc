
import { pgTable, uuid, varchar } from "drizzle-orm/pg-core";

export const users = pgTable('users', {
    id : uuid("id").primaryKey().defaultRandom(),
    clerkId : varchar("clerkId" , {length : 256}).unique(),
    username : varchar("username" , { length : 256 }).unique(),
    email : varchar("email" , { length : 256 }).unique()
});

export const docs = pgTable( "docs" , {
    id : uuid("id").primaryKey().defaultRandom(),
    usersClerkId : varchar("usersClerkId", { length: 256 }).references(() => users.clerkId),
    docName : varchar("docName" , { length : 150 }).unique(),
    description : varchar("description" , { length : 256 }),
})


