import "dotenv/config"
import { Worker } from "bullmq"
import { connection } from "../config"
import { embeddings, qdrantClient } from "@repo/config"
import { FileJobData } from "../types/types"
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf"
import { CharacterTextSplitter } from "@langchain/textsplitters"
import { QdrantVectorStore } from "@langchain/qdrant"
import { db } from "@repo/database"
import { docs } from "@repo/database/schema"
import { unlink } from "fs"

const worker = new Worker<FileJobData>("file-processing", async (job) => {
    
    const loader = new PDFLoader(job.data.filePath , {
        pdfjs: () => import("pdfjs-dist/legacy/build/pdf.js"),
        splitPages : true
    })
    
    try {

        const doc = await loader.load()
        const splitter = new CharacterTextSplitter({ chunkOverlap : 200 , chunkSize : 1500})
        const splitedDocs = await splitter.splitDocuments(doc)

        const totalPages : number = splitedDocs[splitedDocs.length - 1]?.metadata.pdf.totalPages
        
        const response = await db.insert(docs).values({

            usersClerkId : job.data.userId,
            title : job.data.title,
            description : job.data.description,
            pages : totalPages,
            size : job.data.size
            
        }).returning({ id : docs.id})

        if(!response || !response[0])return {
            success : false,
            error : "Unable to process the file"
        }
        
        const docId = response[0].id 

        const docsWithMeta = splitedDocs.map(doc => ({
            ...doc,
            metadata: { ...doc.metadata, docId : docId }
        }))

        const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings , {
            collectionName: "docs",
            client : qdrantClient
        })
        const vecData = await vectorStore.addDocuments(docsWithMeta)

        return { success : true  }

    }
    catch (error) {

        return { success : false , error}
    
    } finally {

        unlink(job.data.filePath , (err) => {

            if (err) return console.error(`Failed to delete file ${job.data.filePath}: ` , err)
                
        })
    
    }

}, { connection })

worker.on("completed", () => console.log("task done"))
worker.on("failed" , (job , err) => console.error(`Job ${job && job.id} failed:${err}`) )