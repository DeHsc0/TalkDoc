import { Router } from "express"
import { createDoc, chatDoc } from "../controllers/doc.controller"
import { uploads } from "../middlewares/uploads"

const docRouter : Router = Router()

docRouter.post("/" , uploads.single("document") , createDoc )
docRouter.post("/:docId/chat" , chatDoc)

export default docRouter