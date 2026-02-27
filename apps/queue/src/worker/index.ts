
import { Worker } from "bullmq"
import { connection, embeddings } from "../config"
import { FileJobData } from "../types/types"
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf"
import { CharacterTextSplitter } from "@langchain/textsplitters"
import { QdrantVectorStore } from "@langchain/qdrant"

const worker = new Worker<FileJobData>("file-processing", async (job) => {

    const data = job.data
    
    const loader = new PDFLoader(data.filePath , {
        pdfjs: () => import("pdfjs-dist/legacy/build/pdf.js"),
        splitPages : true
    })

    try {

        
        const doc = await loader.load()
        const splitter = new CharacterTextSplitter({ chunkOverlap : 200 , chunkSize : 1500})
        const splitedDocs = await splitter.splitDocuments(doc)
        
        const docsWithMeta = splitedDocs.map(doc => ({
            ...doc,
            metadata: { ...doc.metadata, docId : job.id }
        }))

        const testEmbed = await embeddings.embedQuery("test")
        console.log("Embedding dims:", testEmbed.length)

        
        const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
            url: process.env.QDRANT_URL,
            collectionName: "docs",
            apiKey : process.env.QDRANT_API_KEY
            
        })
        
        const vecData = await vectorStore.addDocuments(docsWithMeta)

        console.log("Hello World")

    }
    catch (error) {

        
        throw error 
        return { success : false , error}

    
    }

    return { success : true }

}, { connection })

worker.on("completed", () => console.log("task done"))
worker.on("failed" , () => console.log("it failed 59"))