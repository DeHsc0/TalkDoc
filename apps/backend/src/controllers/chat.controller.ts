import { Request, Response } from "express"
import { aiResSchema, chatSchema } from "../types/zod"
import { chats, docs, conversations } from "@repo/database/schema"
import { and, desc, eq } from "drizzle-orm"
import { db } from "@repo/database"
import { ingestPastResQueue } from "@repo/queue"
import { getConnection } from "@repo/config"
import {  getAgent , model } from "../config/ai"
import { getAuth } from "@clerk/express"
import { SystemMessage , HumanMessage } from "langchain"
import { RedisSaver } from "@langchain/langgraph-checkpoint-redis"

async function chatDoc ( req : Request , res : Response ) {

    res.setHeader("Content-Type", "text/plain");
    res.setHeader("Transfer-Encoding", "chunked");

    const { userId } = getAuth(req)

    if(!userId)return res.status(401).end(JSON.stringify({

        success : false, 
        message : "UnAuthorized"

    }))

    const parsedData = chatSchema.safeParse(req.body)

    if( !parsedData.success )return res.status(400).end(JSON.stringify({

        success : false,
        error : "Invalid input"

    }))

    try {

        const connection = getConnection()

        const cache = parsedData.data.conversationId ? await connection.get( `${userId}:${parsedData.data.conversationId}`) : null

        let conversationId = parsedData.data.conversationId

        let pastResponses = cache ? JSON.parse(cache).pastResponses : undefined 

        let docId = cache ? JSON.parse(cache).docId : undefined

        if ( !cache ) {

            const doc = await db.select().from(docs).where(
                and(
                    eq(docs.id , parsedData.data.docId.toString()),
                    eq(docs.usersClerkId , userId )
                )
            ).limit(1)
    
            if(!doc[0]) return res.status(404).end(JSON.stringify({
    
                success : false,
                error : "Doc not found"
    
            }))

            docId = doc[0].id
    
            if (!parsedData.data.conversationId) {
    
                try {

                    const title = await model.invoke([ new SystemMessage(`You are a conversation title generator.

                    Your only task is to generate a short, clear, and meaningful title for a conversation based on the user’s first message (and optionally the uploaded document context if provided).

                    ### Output Rules
                    - Be concise: 3–8 words maximum
                    - Focus on the user’s goal or intent, not the exact wording of the query
                    - Prefer specific and descriptive titles over generic ones
                    - If the message is ambiguous, infer the most likely intent and create a reasonable title
                    - If the message is a greeting or extremely vague, use a neutral title like “New Conversation” or “Casual Chat”
                    - Never include quotes, periods, or unnecessary punctuation in the title
                    - Output only the title — nothing else

                    ### Examples

                    User: "Summarize the key findings from this research paper"
                    Title: Research Paper Summary

                    User: "What are the main risks mentioned in the contract?"
                    Title: Contract Risk Analysis

                    User: "Extract all action items from the meeting notes"
                    Title: Meeting Action Items

                    User: "Compare the financial performance across the last three years"
                    Title: Multi-Year Financial Comparison

                    User: "Explain the methodology section in simpler terms"
                    Title: Methodology Explained Simply

                    User: "Find contradictions or inconsistencies in this document"
                    Title: Document Inconsistency Check

                    User: "Create a list of all stakeholders mentioned"
                    Title: Stakeholder List Extraction

                    User: "What does this policy say about remote work?"
                    Title: Remote Work Policy Details

                    User: "Help me understand the technical architecture"
                    Title: Technical Architecture Overview

                    User: "Hey, can you help me with this document?"
                    Title: New Conversation

                    User: "Hello"
                    Title: New Conversation

                    User: "Hi, let's chat casually"
                    Title: Casual Conversation`) , new HumanMessage(parsedData.data.searchQuery)])
                    
                    const convo = await db.insert(conversations).values({docId, usersClerkId : userId , title : title.content as string }).returning()
                    
                    conversationId = convo[0]?.id
    
                }
                
                catch(error){
                    
                    return res.status(500).end(JSON.stringify({
    
                        success : false,
                        message : "Unable to create a conversation"
                    
                    }))
    
                }
    
            }

            pastResponses = await db.select().from(chats)
            .where(
                and( 
                    eq(chats.conversationId , conversationId || ""), 
                    eq( chats.usersClerkId , userId ) 
                
                ))
            .orderBy(desc(chats.createdAt))
            .limit(10)
    
            const setCache = await connection.set( `${userId}:${conversationId}` , JSON.stringify({
    
                docId : doc[0].id ,
                pastResponses
    
            }) , "EX" , 3600 )
        
        }

        const agent = await getAgent()

        const events = await agent.streamEvents({ messages : [{ role : "user" , content : `
                
            pastMessages : ${JSON.stringify({ data : pastResponses})},
            userQuery : ${parsedData.data.searchQuery}

        `}] }, { version : "v3" , context : { docId , userId} , configurable : { thread_id : conversationId}})

        const agentOutput = (await events.output).structuredResponse

        res.write(JSON.stringify({
            data: {
                agentRes: JSON.stringify(agentOutput),
            },
        }))
        
        ingestPastResQueue.add( "past-res" , {

            searchQuery : parsedData.data.searchQuery,
            conversationId : conversationId || "",
            userId,
            aiResponse : JSON.stringify(agentOutput)
        
        })    
    
    }
    catch(err) {

        console.error("Original DB error:", err)

        return res.status(500).end(JSON.stringify({

            success : false,
            message : "Internal Server Error",
            err
        
        }))
        

    }

}

async function getChats (req : Request , res : Response ) {


    const { userId } = getAuth(req)

    if(!userId) return res.status(401).json({

        success : false,
        message : "Invalid User"

    })

    const { docId , conversationId} = req.params

    if(!docId || !conversationId)return res.status(400).json({

        success : false,
        message : "Invalid Input"

    })

    try{

        const doc = await  db
        .select({ doc : {

            id : docs.id,
            title : docs.title,
            pages : docs.pages,
            size : docs.size,
            description : docs.description,
            createdAt : docs.createdAt

        }, conversationId: conversations.id })
        .from(docs)
        .innerJoin(conversations, and(
            eq(conversations.docId, docs.id),
            eq(conversations.id, conversationId)
        ))
        .where(and(
            eq(docs.id, docId),
            eq(docs.usersClerkId, userId),
            eq(conversations.usersClerkId, userId)
        ))
        .limit(1)

        if (!doc[0]) return res.status(404).json({

            success : false,
            message : "Document dosent exists."

        })

        const response = await db.select({ chats : {

            id : chats.id,
            conversationId : chats.conversationId,
            aiResponse : chats.aiResponse,
            usersResponse : chats.usersResponse,
            createdAt : chats.createdAt

        }}).from(chats).where(eq(chats.conversationId , conversationId )).orderBy(desc(chats.createdAt))

        const result = {

            doc,
            chats: response

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
