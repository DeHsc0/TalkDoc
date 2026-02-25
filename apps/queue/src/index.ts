
import { Queue } from "bullmq"
import { FileJobData } from "./types/types"
import { connection } from "./config.js"

const fileQueue = new Queue<FileJobData>( "file-processing" , { connection })

export { fileQueue }