import { Router } from "express"
import webhookRouter from "./webhook.routes"

const apiRouter : Router = Router()

apiRouter.use("/webhook" , webhookRouter )

export default apiRouter