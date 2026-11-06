import "dotenv/config"
import { Queue, QueueEvents } from "bullmq"
import { FileJobData , IngestPastResData } from "./types/types"
import { getConnection } from "@repo/config"

const fileQueue = new Queue<FileJobData>( "file-processing" , { connection: getConnection() })
const fileQueueEvents = new QueueEvents("file-processing", { connection : getConnection() });

const ingestPastResQueue = new Queue<IngestPastResData>( "ingest-past-res" , { connection:  getConnection() })
const ingestPastResQueueEvents = new QueueEvents("ingest-past-res", { connection: getConnection() });


export { fileQueue , fileQueueEvents , ingestPastResQueue , ingestPastResQueueEvents }