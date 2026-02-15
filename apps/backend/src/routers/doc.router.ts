import { Router } from "express"
import { uploads } from "../app"
import { createDoc } from "../controllers/doc.controller"

const docRouter : Router = Router()

docRouter.post("/" , uploads.single("file") , createDoc )

export default docRouter