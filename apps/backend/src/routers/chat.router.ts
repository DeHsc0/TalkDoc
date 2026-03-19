import { Router } from "express"
import { chatDoc , getChats } from "../controllers/chat.controller"

const chatRouter : Router = Router()

chatRouter.post("/" , chatDoc )
chatRouter.get("/:docId" , getChats )

export { chatRouter }

