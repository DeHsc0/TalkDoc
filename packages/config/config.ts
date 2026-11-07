import "dotenv/config"
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai"
import { QdrantClient } from "@qdrant/js-client-rest"
import Redis from "ioredis";

function getConnection () {
  const connection = new Redis( process.env.REDIS_URL || "", {
          maxRetriesPerRequest : null
      } 
  )
  return connection 

}

const embeddings = new GoogleGenerativeAIEmbeddings({
  model: "gemini-embedding-001",
  apiKey : process.env.GOOGLE_API_KEY,
})

const qdrantClient = new QdrantClient({
  url : process.env.QDRANT_URL,
  port : Number(process.env.QDRANT_PORT) || 6333,
  apiKey : process.env.QDRANT_API_KEY,
  checkCompatibility : false
})

export { embeddings , qdrantClient , getConnection }