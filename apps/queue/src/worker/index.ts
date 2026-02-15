import { Worker } from "bullmq"

const worker = new Worker( "file-processing" , async ( job ) => {

    console.log(job)   

} )


worker.on( "completed" , () => console.log("JOB DONE!!!!"))