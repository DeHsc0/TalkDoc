import { fileQueue, queueEvents }  from "@repo/queue"
import { Request, Response } from "express";
import { docCreationSchema } from "../types/zod";
import path, { parse } from "path"
import { db } from "@repo/database";
import {  docs } from "@repo/database/schema";
import {  and , eq } from "drizzle-orm";
import { getAuth } from "@clerk/express";
import { qdrantClient } from "@repo/config";

async function getDocs (req : Request , res : Response ) {

    const { userId } = getAuth(req)

    if(!userId)return res.status(400).json({

        success : false,
        error  : "Missing userId"

    })

    try{

        const response = await db.select({

            id : docs.id,
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

        console.error("Failed to fetch documents:", e)
        
        return res.status(500).json({

            success : false,
            message : "Failed to fetch documents"

        })

    }

} 

async function createDoc ( req : Request , res : Response) {

    const { userId } = getAuth(req)

    if(!userId)return res.status(400).json({

        success : false,
        error  : "Missing userId"

    })

    const parsedData = docCreationSchema.safeParse({

        name : req.body.name,
        document : req.file,
        description : req.body.description
        
    })

    if(!parsedData.success) return res.status(400).json({

        success : false,
        error : "Invalid input",
        e : parsedData.error
    })

    if(!req.file)return res.status(400).json({

        success : false,
        error : "Requires a document to create one"

    })

    const size = (parsedData.data.document.size / (1024 * 1024)).toFixed(2)
    
    const data = await fileQueue.add("file", {

        filePath : path.resolve(req.file.path),
        originalName : parsedData.data.document.originalname,
        userId ,
        description : parsedData.data.description, 
        size,
        title : parsedData.data.name
        
    } )

    const job : { success : boolean , error ?: string , data : {
        id : string
        createdAt: Date;
        title: string;
        description: string | null;
        pages: number | null;
        size: string | null;
    } 

    } = await data.waitUntilFinished(queueEvents)  

    if(!job.success)return res.status(400).json({

        success : false,
        message : "Failed to create a doc"

    })

    return res.status(200).json({
        success : true,
        data: job.data,
        message : "Doc created Successfully"
    })

}

async function deleteDoc ( req : Request , res : Response) {

    const { docId } = req.params

    const { userId } = getAuth(req)

    if(!userId)return res.status(301).json({

        success : false,
        message : "UnAuthorized"

    })

    if(!docId)return res.status(400).json({

        success : false,
        message : "Invalid input"

    })

    try{

        const vector = await qdrantClient.delete( "docs" , {

         filter : {

            must : [

                {
                    key : "metadata.docId",
                    match : { value : docId}
                }
            
            ]

         }   

        })

        const response = await db.delete(docs).where(

            and(

                eq( docs.usersClerkId , userId),
                eq( docs.id , docId)

            )
        )

        return res.status(200).json({

            response

        })

    }
    catch (e) {

        console.error( "Failed to delete document: " , e )

        return res.status(500).json({

            success : false,
            message : "Failed to delete the doc"
        })

    }

}

export { createDoc , getDocs , deleteDoc }    