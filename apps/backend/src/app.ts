import "dotenv/config"
import express from "express"
import apiRouter from "./routers"
import { clerkMiddleware } from "@clerk/express"
import cors from "cors"

const app = express()

app.use(clerkMiddleware())
app.use(express.json())
app.use(cors())

app.use("/api" , apiRouter )

app.listen( process.env.BACKEND_PORT || 3001 , async () => {

})
