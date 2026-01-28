import { Router } from "express"
import { webHookController } from "../controllers/webhook.controllers"

const webhookRouter : Router = Router()


webhookRouter.post("/" , webHookController )

export default webhookRouter