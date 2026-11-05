import "dotenv/config"
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai"
import { QdrantClient } from "@qdrant/js-client-rest"
import Redis from "ioredis";


const connection = new Redis( process.env.REDIS_URL || "", {
        maxRetriesPerRequest : null
    } 
)

const embeddings = new GoogleGenerativeAIEmbeddings({
  model: "gemini-embedding-001",
  apiKey : process.env.GOOGLE_API_KEY,
})

const qdrantClient = new QdrantClient({
  url : process.env.QDRANT_URL,
  port : 443,
  apiKey : process.env.QDRANT_API,
  checkCompatibility : false
})

export { embeddings , qdrantClient , connection }