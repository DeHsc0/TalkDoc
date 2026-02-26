import Redis from "ioredis";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

const connection = new Redis( process.env.REDIS_URL , {
        maxRetriesPerRequest : null
    } 
)

const embeddings = new GoogleGenerativeAIEmbeddings({
  model: "text-embedding-004",
  apiKey : process.env.GEMINI_API_KEY
});

export { connection , embeddings }