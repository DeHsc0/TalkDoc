import "dotenv/config"
import { Queue, QueueEvents } from "bullmq"
import { FileJobData } from "./types/types"
import { connection } from "./config.js"

const fileQueue = new Queue<FileJobData>( "file-processing" , { connection })
const queueEvents = new QueueEvents("file-processing", { connection });

export { fileQueue , queueEvents}