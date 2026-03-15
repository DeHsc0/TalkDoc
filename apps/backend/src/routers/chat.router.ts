import { Router } from "express"
import { chatDoc } from "../controllers/chat.controller"

const chatRouter : Router = Router()

chatRouter.post("/" , chatDoc )

export { chatRouter }

