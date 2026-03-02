import { fileQueue, queueEvents }  from "@repo/queue"
import { Request, Response } from "express";
import { chatSchema, docCreationSchema } from "../types/zod";
import path from "path";
import { randomUUID } from "crypto";
import z from "zod";
import { db } from "@repo/database";
import { docs } from "@repo/database/schema";
import { eq, sql } from "drizzle-orm";

async function createDoc ( req : Request , res : Response) {

    const parseData = docCreationSchema.safeParse({

        name : req.body.name,
        document : req.file,
        description : req.body.description
        
    })

    if(!parseData.success) return res.status(400).json({

        message : "Invalid input",
        errors : parseData.error.format()
    })

    if(!req.file)return
    
    const data = await fileQueue.add("file", {

        filePath : path.resolve(req.file.path),
        originalName : parseData.data.document.originalname,
        userId : "62543b6c-aeee-4a71-9804-fc44cd010803",  // replace
        description : parseData.data.description                  
        
    } , { jobId : randomUUID().toString() })

    const job : { success : boolean , error ?: string } | any = await data.waitUntilFinished(queueEvents)  

    res.status(200).json({
        message : "Doc created Successfully",
        f : req.file && path.resolve(req.file.path),
        data, 
        job
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
        error : parsedData.error.format()

    })

    try {
        
        const doc = await db.select().from(docs).where(eq(docs.id , docId))
        
        return res.status(200).json({
            success : true,
            docId,
            doc
        })
    
    }
    catch(err) {

        console.error("Original DB error:", err)

        return res.status(500).json({

            success : false,
            error : String(err),
        
        })
        

    }



}

export { createDoc , chatDoc }    