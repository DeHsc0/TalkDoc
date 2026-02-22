import { Worker } from "bullmq"

const worker = new Worker( "file-processing" , async ( job ) => {

    return { success : true }

} )


worker.on( "completed" , () => console.log("JOB DONE!!!!"))