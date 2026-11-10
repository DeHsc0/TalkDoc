import "dotenv/config"
import { Worker } from "bullmq"
import { embeddings, qdrantClient , getConnection } from "@repo/config"
import { FileJobData, IngestPastResData } from "../types/types"
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf"
import { CharacterTextSplitter } from "@langchain/textsplitters"
import { QdrantVectorStore } from "@langchain/qdrant"
import { db } from "@repo/database"
import { docs , chats } from "@repo/database/schema"
import { uploadFile } from "../helper"

const fileWorker = new Worker<FileJobData>("file-processing", async (job) => {

    const fileBuffer = Buffer.from(job.data.fileBase64 , "base64")

    const pdfBlob = new Blob([Uint8Array.from(fileBuffer)], {
        type: "application/pdf",
    })
    
    const loader = new PDFLoader( pdfBlob , {
        pdfjs: () => import("pdfjs-dist/legacy/build/pdf.js"),
        splitPages : true
    })
    
    try {

        const doc = await loader.load()
        const splitter = new CharacterTextSplitter({ chunkOverlap : 200 , chunkSize : 1500})
        const splitedDocs = await splitter.splitDocuments(doc)

        const totalPages : number = splitedDocs[splitedDocs.length - 1]?.metadata.pdf.totalPages

        const filePubUrl = await uploadFile( job.data.originalName , fileBuffer )
        
        const response = await db.insert(docs).values({

            usersClerkId : job.data.userId,
            title : job.data.title,
            description : job.data.description,
            pages : totalPages,
            size : job.data.size.toFixed(2),
            url : filePubUrl
            
        }).returning()

        if(!response || !response[0])return {
            success : false,
            error : "Unable to process the file"
        }
        
        const docId = response[0].id 

        const docsWithMeta = splitedDocs.map(doc => ({
            ...doc,
            metadata: { ...doc.metadata, docId : docId , userId : job.data.userId }
        }))

        const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings , {
            collectionName: "docs",
            client : qdrantClient
        })
        const vecData = await vectorStore.addDocuments(docsWithMeta)

        return { success : true , data : response[0] }

    }
    catch (error) {
        console.error("File worker failed:", error);
        throw error instanceof Error ? error : new Error(String(error));
    }

}, { connection : getConnection() })

const ingestPastResWorker = new Worker<IngestPastResData>("ingest-past-res", async (job) => {
    
    try {
        
        const insertChats = await db.insert(chats).values({
            
            usersResponse : job.data.searchQuery,
            conversationId : job.data.conversationId,
            usersClerkId : job.data.userId,
            aiResponse : job.data.aiResponse, 
        })

        return { "success" : true }
        
    }
    catch(err) {
        
        throw new Error(JSON.stringify(err))
        
    }
    
} ,{ connection : getConnection() })

