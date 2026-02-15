import { Router } from "express"
import webhookRouter from "./webhook.routes"
import docRouter from "./doc.router"

const apiRouter : Router = Router()

apiRouter.use("/webhook" , webhookRouter )
apiRouter.use("/doc" , docRouter )

export default apiRouter