import { fileQueue }  from "@repo/queue"
import { Request, Response } from "express";

function createDoc ( req : Request , res : Response) {

    const file = req.body

    fileQueue.add("file" , file)

}

export { createDoc }