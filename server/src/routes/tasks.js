import express from "express"
import { authGuard } from "../middleware/auth.js"
import {
  createTask,
  deleteTask,
  fetchTasks,
  updateTask,
} from "../controllers/taskController.js"

const router = express.Router()

router.use(authGuard)
router.get("/", fetchTasks)
router.post("/", createTask)
router.put("/:id", updateTask)
router.delete("/:id", deleteTask)

export default router
