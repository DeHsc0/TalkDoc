
import { Queue } from "bullmq"
import { Redis} from "ioredis"
import { FileJobData } from "./types/types"

const connection = new Redis( process.env.REDIS_URL, {
        maxRetriesPerRequest : null
    } 
)

export const fileQueue = new Queue<FileJobData>( "file-processing" , { connection })
