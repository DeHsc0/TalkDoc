type FileJobData =  {

    filePath : string,
    title : string,
    originalName : string,
    userId : string,
    description : string | undefined,
    size : number 
    
}

type IngestPastResData = {

    searchQuery : string, 
    conversationId : string, 
    userId : string, 
    aiResponse : string

}

export type { FileJobData , IngestPastResData }