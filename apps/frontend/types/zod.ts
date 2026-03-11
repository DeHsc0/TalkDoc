import z from "zod";

const DocSchema = z.object({

    title : z.string(),
    pages : z.number(),
    size : z.string(),
    description : z.string(),
    createdAt : z.string().datetime()

})