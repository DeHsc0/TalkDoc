
import z from "zod";

const fileSchema = z.object({

    fieldname : z.string().max(8),
    originalname : z.string().max(200),
    encoding : z.string(),
    mimetype: z.enum(['image/jpeg', 'image/png', 'application/pdf']),
    buffer : z.instanceof(Buffer).optional(),
    size : z.number().positive().max(10 * 1024 * 1024),
    path: z.string().optional()

})

const docCreationSchema = z.object({

    name : z.string().max(200),
    document : fileSchema,
    description : z.string().optional()
    
})

const chatSchema = z.object({
    
    searchQuery : z.string().max(600),
    docId : z.string().max(200)    

})

const aiResSchema = z.object({

    id : z.string(),
    text : z.string()

}) 


export { docCreationSchema , chatSchema , aiResSchema  }