
import { Worker } from "bullmq"
import { connection } from "../config"
import { FileJobData } from "../types/types"
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf"

const worker = new Worker<FileJobData>("file-processing", async (job) => {

    const data = job.data
    
    const loader = new PDFLoader(data.filePath , {
        pdfjs: () => import("pdfjs-dist/legacy/build/pdf.js")
    })

    const doc = await loader.load()

    console.log(doc[0])

    return { success: true }

}, { connection })

worker.on("completed", () => console.log("task done"))