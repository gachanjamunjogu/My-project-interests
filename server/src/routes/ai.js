import express from "express"
import { authGuard } from "../middleware/auth.js"
import { parseTask, suggestItinerary } from "../controllers/aiController.js"

const router = express.Router()

router.use(authGuard)
router.post("/parse", parseTask)
router.post("/suggest", suggestItinerary)

export default router
