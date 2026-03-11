import { Router } from "express"
import { createDoc, chatDoc, getDocs } from "../controllers/doc.controller"
import { uploads } from "../middlewares/uploads"

const docRouter : Router = Router()

docRouter.post("/create" , uploads.single("document") , createDoc )
docRouter.post("/:docId/chat" , chatDoc)
docRouter.post( "/" , getDocs )

export default docRouter