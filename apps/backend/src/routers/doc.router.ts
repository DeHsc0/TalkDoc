import { Router } from "express"
import { createDoc, getDocs, deleteDoc } from "../controllers/doc.controller"
import { uploads } from "../middlewares/uploads"

const docRouter : Router = Router()

docRouter.post("/" , uploads.single("document") , createDoc )
docRouter.get( "/" , getDocs )
docRouter.delete("/:docId" , deleteDoc)

export default docRouter