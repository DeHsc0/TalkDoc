import { Router } from "express"
import { createDoc } from "../controllers/doc.controller"
import { uploads } from "../middlewares/uploads"

const docRouter : Router = Router()

docRouter.post("/" , uploads.single("document") , createDoc )

export default docRouter