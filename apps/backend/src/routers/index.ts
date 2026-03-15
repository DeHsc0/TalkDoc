import { Router } from "express"
import webhookRouter from "./webhook.routes"
import docRouter from "./doc.router"
import { chatRouter } from "./chat.router"

const apiRouter : Router = Router()

apiRouter.use("/webhook" , webhookRouter )
apiRouter.use("/doc" , docRouter )
apiRouter.use("/chat" , chatRouter)

export default apiRouter