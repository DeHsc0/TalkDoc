import z from "zod";

const doc =  z.object({

        id : z.string(),
        title : z.string(),
        pages : z.number(),
        size : z.string(),
        description : z.string(),
        createdAt : z.string().datetime()
        

    })

const docSchema = z.array(doc)

const docCreationSchema = z.object({

    name : z.string(),
    description : z.string().optional(),
    document : z.instanceof(File).refine(f => f.type === "application/pdf" , "Only PDF files are allowed")           

})

const chatsSchema = z.object({

    id : z.string(),
    docId : z.string(),
    aiResponse : z.string(),
    usersResponse : z.string(),
    createdAt : z.string().datetime()

})

const chatsDataSchema = z.array(chatsSchema)


export { docSchema , docCreationSchema , doc , chatsDataSchema}