import "dotenv/config"
import { Queue, QueueEvents } from "bullmq"
import { FileJobData , IngestPastResData } from "./types/types"
import { connection } from "@repo/config"

const fileQueue = new Queue<FileJobData>( "file-processing" , { connection })
const fileQueueEvents = new QueueEvents("file-processing", { connection });

const ingestPastResQueue = new Queue<IngestPastResData>( "ingest-past-res" , { connection })
const ingestPastResQueueEvents = new QueueEvents("ingest-past-res", { connection });


export { fileQueue , fileQueueEvents , ingestPastResQueue , ingestPastResQueueEvents }