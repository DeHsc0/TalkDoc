import express from "express"
import apiRouter from "./routers"

const app = express()

app.use(express.json())

app.use("/api" , apiRouter )