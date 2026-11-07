import { getAuth } from "@clerk/express"
import { Request, Response } from "express"
import { db } from "@repo/database"
import { docs , conversations } from "@repo/database/schema"
import { eq , and } from "drizzle-orm"

async function getConversations (req : Request , res : Response ) {

    const { userId } = getAuth(req)

    if(!userId)return res.status(401).json({

        success : false,
        error  : "Missing userId"

    })

    try {

        const {docId } = req.params
   
        if (!docId)return res.status(400).json({

            success : false, 
            message : "Missing Params"
        })
        
        const doc = await db.select({
    
            id : docs.id,
            title : docs.title,
            url : docs.url,
            description : docs.description,
            pages : docs.pages,
            size : docs.size,
            createdAt : docs.createdAt
    
        }).from(docs).where( and(
            eq(docs.usersClerkId , userId), 
            eq( docs.id , docId )
        ))
    
        if (!doc[0]) return res.status(404).json({
    
            success : false, 
            message : "Document dosent exists."
    
        })
    
        const convos = await db.select({ conversation : { title : conversations.title }}).from(conversations).where(and( eq( conversations.docId , doc[0].id ) , eq( conversations.usersClerkId , userId ) ))
    
        return res.status(200).json({
    
            success : true,
            data : { convos , doc }
    
        })

    } catch(err) {
        
        res.json({ message : "Something went wrong." , success : false })
    
    }


}

export { getConversations }
