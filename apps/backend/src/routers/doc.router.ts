import { Router } from "express"
import { createDoc, getDocs, deleteDoc } from "../controllers/doc.controller"
import { uploads } from "../middlewares/uploads"

const docRouter : Router = Router()

docRouter.post("/create" , uploads.single("document") , createDoc )
docRouter.get( "/:userId" , getDocs )
docRouter.delete("/" , deleteDoc)

export default docRouter