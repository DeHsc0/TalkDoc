import { fileQueue, queueEvents }  from "@repo/queue"
import { Request, Response } from "express";
import { aiResSchema, chatSchema, docCreationSchema, getDocSchema } from "../types/zod";
import path from "path"
import { db } from "@repo/database";
import {  chats, docs } from "@repo/database/schema";
import {  and, desc, eq } from "drizzle-orm"; 
import { qdrantClient , embeddings } from "@repo/config";
import { ai, aiResponseSchema } from "../config/ai";

async function getDocs (req : Request , res : Response ) {

    const parsedData = getDocSchema.safeParse({
        
        userId : req.body.userId

    })

    if(!parsedData.success)return res.status(400).json({

        success : false,
        error  : "Invalid Input"

    })

    const response = await db.select().from(docs).where(eq(docs.usersClerkId , parsedData.data.userId))

    return res.status(200).json({

        response

    })

} 

async function createDoc ( req : Request , res : Response) {

    const parseData = docCreationSchema.safeParse({

        name : req.body.name,
        document : req.file,
        description : req.body.description
        
    })

    if(!parseData.success) return res.status(400).json({

        success : false,
        error : "Invalid input"
    })

    if(!req.file)return res.status(400).json({

        success : false,
        error : "Requires a document to create one"

    })

    const size = (parseData.data.document.size / (1024 * 1024)).toFixed(2)
    
    const data = await fileQueue.add("file", {

        filePath : path.resolve(req.file.path),
        originalName : parseData.data.document.originalname,
        userId : "62543b6c-aeee-4a71-9804-fc44cd010803",  // replace
        description : parseData.data.description, 
        size   
        
    } )

    const job : { success : boolean , error ?: string } | any = await data.waitUntilFinished(queueEvents)  

    res.status(200).json({
        success : true,
        message : "Doc created Successfully"
    })

}

async function chatDoc ( req : Request , res : Response ) {

    const { docId } = req.params 
    
    if(!docId)return res.status(400).json({

        sucess : false,
        error : "Missing docId param"

    })

    const parsedData = chatSchema.safeParse(req.body)

    if( !parsedData.success )return res.status(400).json({

        success : false,
        error : "Invalid input"

    })

    try {
        
        const doc = await db.select().from(docs).where(eq(docs.id , docId.toString()))

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
                        match: { value: docId }
                    }
                ]
            }
        })

        const pastResponses = await db.select().from(chats)
        .where(
            and( 
                eq(chats.docId , docId), 
                eq( chats.usersClerkId , parsedData.data.userId ) 
            
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
            error : "Failed to fetch ai response"

        }) 

        const parsedAiResponse = aiResSchema.safeParse((JSON.parse(aiResponse.text)))

        if(!parsedAiResponse)return 

        const relevantDoc = results.find((e) => e.id === parsedAiResponse.data?.id)
        
        return res.status(200).json({
            success : true,
            data : parsedAiResponse,
            relevantDoc
        })
    
    }
    catch(err) {

        console.error("Original DB error:", err)

        return res.status(500).json({

            success : false,
            error : "Internal Server Error",
        
        })
        

    }



}

export { createDoc , chatDoc , getDocs }    