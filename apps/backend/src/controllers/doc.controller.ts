import { fileQueue, queueEvents }  from "@repo/queue"
import { Request, Response } from "express";
import { aiResSchema, chatSchema, deleteDocSchema, docCreationSchema } from "../types/zod";
import path from "path"
import { db } from "@repo/database";
import {  chats, docs } from "@repo/database/schema";
import {  and , desc , eq } from "drizzle-orm"; 
import { qdrantClient , embeddings } from "@repo/config";
import { ai, aiResponseSchema } from "../config/ai";

async function getDocs (req : Request , res : Response ) {

    const { userId } = req.params

    if(!userId)return res.status(400).json({

        success : false,
        error  : "Missing userId"

    })

    try{

        const response = await db.select({

            title : docs.title,
            description : docs.description,
            pages : docs.pages,
            size : docs.size,
            createdAt : docs.createdAt

        }).from(docs).where(eq(docs.usersClerkId , userId))

        return res.status(200).json({

            response

        })
    
    }
    
    catch(e){

        return res.status(400).json({

            success : false,
            message : "Failed to fetch documents"

        })

    }

} 

async function createDoc ( req : Request , res : Response) {

    const parsedData = docCreationSchema.safeParse({

        name : req.body.name,
        document : req.file,
        description : req.body.description
        
    })

    if(!parsedData.success) return res.status(400).json({

        success : false,
        error : "Invalid input"
    })

    if(!req.file)return res.status(400).json({

        success : false,
        error : "Requires a document to create one"

    })

    const size = (parsedData.data.document.size / (1024 * 1024)).toFixed(2)
    
    const data = await fileQueue.add("file", {

        filePath : path.resolve(req.file.path),
        originalName : parsedData.data.document.originalname,
        userId : "62543b6c-aeee-4a71-9804-fc44cd010803",  // replace
        description : parsedData.data.description, 
        size,
        title : parsedData.data.name
        
    } )

    const job : { success : boolean , error ?: string } | any = await data.waitUntilFinished(queueEvents)  

    res.status(200).json({
        success : true,
        message : "Doc created Successfully"
    })

}

async function deleteDoc ( req : Request , res : Response) {

    const parsedData = deleteDocSchema.safeParse(req.body)
    
    if(!parsedData.success)return res.status(400).json({

        success : false,
        message : "Invalid input"

    })

    try{

        const response = await db.delete(docs).where(

            and(

                eq( docs.usersClerkId , parsedData.data.userId),
                eq( docs.id , parsedData.data.docId)

            )
        )

        return res.status(200).json({

            response

        })

    }
    catch (e) {

        return res.status(400).json({

            success : false,
            message : "Failed to delete the doc",
            error : e
        })

    }

}

export { createDoc , getDocs , deleteDoc }    