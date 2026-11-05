


import { Request, Response } from "express"
import { aiResSchema, chatSchema } from "../types/zod"
import { chats, docs, conversations } from "@repo/database/schema"
import { and, desc, eq } from "drizzle-orm"
import { db } from "@repo/database"
import { ingestPastResQueue } from "@repo/queue"
import { aiResponseSchema , agent } from "../config/ai"
import { getAuth } from "@clerk/express"

async function chatDoc ( req : Request , res : Response ) {

    const { userId } = getAuth(req)

    if(!userId)return res.status(301).json({

        success : false, 
        message : "UnAuthorized"

    })

    const parsedData = chatSchema.safeParse(req.body)

    if( !parsedData.success )return res.status(400).json({

        success : false,
        error : "Invalid input"

    })

    try {
        
        const doc = await db.select().from(docs).where(
            and(
                eq(docs.id , parsedData.data.docId.toString()),
                eq(docs.usersClerkId , userId )
            )
        ).limit(1)

        if(!doc[0]) return res.status(400).json({

            success : false,
            error : "Doc not found"

        })

        let conversationId = parsedData.data.conversationId

        if (!parsedData.data.conversationId) {

            try {
                
                const convo = await db.insert(conversations).values({docId : doc[0].id , usersClerkId : userId}).returning()
                
                conversationId = convo[0]?.id

            }
            
            catch(error){
                
                return res.status(500).json({

                    success : false,
                    message : "Unable to create a conversation"
                
                })

            }

        }

        const pastResponses = await db.select().from(chats)
        .where(
            and( 
                eq(chats.conversationId , conversationId || ""), 
                eq( chats.usersClerkId , userId ) 
            
            ))
        .orderBy(desc(chats.createdAt))
        .limit(2)


        const aiResponse = await agent.invoke({ messages : { role : "user" , content : `
                
            pastMessages : ${JSON.stringify(pastResponses)},
            userQuery : ${parsedData.data.searchQuery}
            
                
            
        `}})

        if(!aiResponse || !aiResponse.text)return res.status(400).json({

            success : false,
            message : "Failed to fetch ai response"

        }) 

        const parsedAiResponse = aiResSchema.safeParse((JSON.parse(aiResponse.text)))

        if(!parsedAiResponse.success) return res.status(400).json({

            success : false,
            message : "Invalid AI response format"

        })

        ingestPastResQueue.add( "" , {

            searchQuery : parsedData.data.searchQuery,
            conversationId : conversationId || "",
            userId,
            aiResponse : parsedAiResponse.data.text, // AI Response 
        
        })
        
        return res.status(200).json({
            success : true,
            data : parsedAiResponse.data,
        })
    
    }
    catch(err) {

        console.error("Original DB error:", err)

        return res.status(500).json({

            success : false,
            message : "Internal Server Error",
            err
        
        })
        

    }



}

async function getChats (req : Request , res : Response ) {


    const { userId } = getAuth(req)

    if(!userId) return res.status(400).json({

        success : false,
        message : "Invalid User"

    })

    const { docId } = req.params

    if(!docId)return res.status(400).json({

        success : false,
        message : "Invalid Input"

    })

    try{

        const response = await db
            .select({
                doc : {

                    id : docs.id,
                    title : docs.title,
                    pages : docs.pages,
                    size : docs.size,
                    description : docs.description,
                    createdAt : docs.createdAt

                },

                chats : {

                    id : chats.id,
                    docId : chats.docId,
                    aiResponse : chats.aiResponse,
                    usersResponse : chats.usersResponse,
                    createdAt : chats.createdAt

                }
            })
            .from(docs)
            .leftJoin(chats , eq(chats.docId, docs.id))
            .where(and(eq( docs.id , docId) , eq( docs.usersClerkId , userId)))

        const result = {

            doc : response[0]?.doc,
            chats: response.map(row => row.chats)

        }
        

        return res.status(200).json({

            success : true,
            message : "Fetched doc chats successfully",
            data : result

        })

    }
    catch(e){

        return res.status(500).json({

            success : false,
            message: "Failed to fetch chats"

        })

    }

}

export { chatDoc , getChats }