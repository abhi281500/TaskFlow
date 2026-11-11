import { Router } from "express";
import { createTask, getTasks, getTaskById, updateTask, deleteTask, getTaskCounts } from "../controllers/taskController.js";
import { protect } from "../middleware/authMiddleware.js";
const router = Router();
router.use(protect);
router.get("/counts", getTaskCounts);
router.route("/").post(createTask).get(getTasks);
router.route("/:id").get(getTaskById).put(updateTask).patch(updateTask).delete(deleteTask);
export default router;
