import { fileQueue, queueEvents }  from "@repo/queue"
import { Request, Response } from "express";
import { docCreation } from "../types/zod";
import path from "path";
import { randomUUID } from "crypto";

async function createDoc ( req : Request , res : Response) {

    const parseData = docCreation.safeParse({

        name : req.body.name,
        document : req.file,
        description : req.body.description
        
    })

    if(!parseData.success) return res.status(400).json({

        message : "Invalid input",
        errors : parseData.error.flatten()
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

async function searchDoc ( req : Request , res : Response ) {

    

}

export { createDoc }    