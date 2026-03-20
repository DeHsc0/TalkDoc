import { Request, Response } from "express"
import { aiResSchema, chatSchema } from "../types/zod"
import { chats, docs } from "@repo/database/schema"
import { and, desc, eq } from "drizzle-orm"
import { db } from "@repo/database"
import { embeddings, qdrantClient } from "@repo/config"
import { ai, aiResponseSchema } from "../config/ai"
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
        )

        if(doc.length <= 0) return res.status(400).json({

            success : false,
            error : "Doc not found"

        })

        const results = await qdrantClient.search("docs", {
            vector: await embeddings.embedQuery(parsedData.data.searchQuery),
            limit: 5,
            filter: {
                must: [
                    {
                        key: "metadata.docId",
                        match: { value: parsedData.data.docId }
                    }
                ]
            }
        })

        const pastResponses = await db.select().from(chats)
        .where(
            and( 
                eq(chats.docId , parsedData.data.docId), 
                eq( chats.usersClerkId , userId ) 
            
            ))
        .orderBy(desc(chats.createdAt))
        .limit(2)

        const context = results.map((e) => {
            return {
                id : e.id,
                contents : e.payload?.content
            }
        })

        const aiResponse = await ai.models.generateContent({
            model : "gemini-2.5-flash",
            contents : `
                {
                    context : ${JSON.stringify(context)},
                    pastMessages : ${JSON.stringify(pastResponses)},
                    userQuery : ${parsedData.data.searchQuery}
            
                }
            
            `,
            config : {
                systemInstruction : `So you are an helpfull ai which answers users questions based on the inputs and user dosent know abou the relevant chunks or past messages so just answer what he asks based on the inputs

                InputSchema : {

                    context : {

                        type : string,
                        description : Contains the relavant chunks of the document about which the users is asking questions

                    },
                    pastMessages : {

                        type : string,
                        description :  contains your past conversations with the user
                    },
                    userQuery : {
                        type : string,
                        description : user query                    
                    }
                
                }

                outputSchema : {
                    id : {
                        type : uuid,
                        description : id of the most relavant chunk provided in the context 
                        example : 1a7be80a-c57f-4ef2-8bb2-a4b79e66f1a6                    
                    },
                    text : {
                        type : string,
                        description : answer to user's question
                    }
                }`,
                responseMimeType : "application/json",
                responseSchema : aiResponseSchema
            }
        })

        if(!aiResponse || !aiResponse.text)return res.status(400).json({

            success : false,
            message : "Failed to fetch ai response"

        }) 

        const parsedAiResponse = aiResSchema.safeParse((JSON.parse(aiResponse.text)))

        if(!parsedAiResponse.success) return res.status(400).json({

            success : false,
            message : "Invalid AI response format"

        })

        const insertChats = await db.insert(chats).values({

            usersResponse : parsedData.data.searchQuery,
            docId : parsedData.data.docId,
            usersClerkId : userId,
            aiResponse : parsedAiResponse.data.text, 
        })

        const relevantDoc = results.find((e) => e.id === parsedAiResponse.data?.id)
        
        return res.status(200).json({
            success : true,
            data : parsedAiResponse.data,
            relevantDoc
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