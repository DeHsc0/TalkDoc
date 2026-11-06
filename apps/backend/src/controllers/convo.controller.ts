import { getAuth } from "@clerk/express"
import { Request, Response } from "express"
import { db } from "@repo/database"
import { docs , conversations } from "@repo/database/schema"
import { eq , and } from "drizzle-orm"

async function getConversations (req : Request , res : Response ) {

    const { userId } = getAuth(req)

    if(!userId)return res.status(400).json({

        success : false,
        error  : "Missing userId"

    })

    try {

        const {docId , conversationId } = req.params
    
        const doc = await db.select({
    
            id : docs.id,
            title : docs.title,
            description : docs.description,
            pages : docs.pages,
            size : docs.size,
            createdAt : docs.createdAt
    
        }).from(docs).where(eq(docs.usersClerkId , userId))
    
        if (!doc[0]) return res.status(301).json({
    
            success : false, 
            message : "Document dosent exists."
    
        })
    
        const convos = await db.select({ conversation : { title : conversations.title }}).from(conversations).where(and( eq( conversations.docId , doc[0].id ) , eq( conversations.usersClerkId , userId ) ))
    
        return res.status(200).json({
    
            success : true,
            data : convos
    
        })

    } catch(err) {
        
        res.json({ message : "Something went wrong." , success : false })
    
    }


}

export { getConversations }