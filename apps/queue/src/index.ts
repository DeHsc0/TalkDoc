
import { Queue } from "bullmq"

const redis = {
    host : process.env.REDIS_HOST,
    port : process.env.REDIS_PORT
}

export const fileQueue = new Queue( "file-processing" , { connection : redis } )
