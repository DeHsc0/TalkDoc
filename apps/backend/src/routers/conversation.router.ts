import { Router } from "express"
import { getConversations } from "../controllers/convo.controller"

const conversationRouter : Router = Router()

conversationRouter.get( "/:docId" , getConversations)

export default conversationRouter