import express from "express"
import apiRouter from "./routers"
import { clerkMiddleware } from "@clerk/express"

const app = express()

app.use(clerkMiddleware())
app.use(express.json())

app.use("/api" , apiRouter )

app.listen( process.env.PORT || 3000 , () => {

    console.log(`Server is running on ${process.env.PORT}`)

})

