import { fileQueue }  from "@repo/queue"
import { Request, Response } from "express";
import { docCreation } from "../types/zod";

async function createDoc ( req : Request , res : Response) {

    const parseData = docCreation.safeParse({

        name : req.body.name,
        document : req.file
        
    })



    if(!parseData.success) return res.status(400).json({

        message : "Invalid input",
        errors : parseData.error.flatten()
    })

    
    
    const data = await fileQueue.add("file", parseData.data.document)

    res.status(200).json({
        message : "Doc created Successfully"
    })

}

export { createDoc }    