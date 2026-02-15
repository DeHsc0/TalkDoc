import express from "express"
import apiRouter from "./routers"
import { clerkMiddleware } from "@clerk/express"
import multer from "multer"

const app = express()

const storage = multer.memoryStorage()

const uploads = multer({
    storage,
    limits : {
        fileSize: 5 * 1024 * 1024
    }
})


app.use(clerkMiddleware())
app.use(express.json())

app.use("/api" , apiRouter )

app.listen( process.env.PORT || 3000 , () => {

    console.log(`Server is running on ${process.env.PORT}`)

})

export { uploads }
