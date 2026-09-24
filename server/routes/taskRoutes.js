const express = require("express");

const router = express.Router();

const {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  completeTask,
} = require("../controllers/taskController");

const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

// Create Task
router.post(
  "/",
  protect,
  authorize("admin", "sales"),
  createTask
);

// Get All Tasks
router.get(
  "/",
  protect,
  authorize("admin", "sales"),
  getTasks
);

// Get Single Task
router.get(
  "/:id",
  protect,
  authorize("admin", "sales"),
  getTaskById
);

// Update Task
router.put(
  "/:id",
  protect,
  authorize("admin", "sales"),
  updateTask
);

// Complete Task
router.patch(
  "/:id/complete",
  protect,
  authorize("admin", "sales"),
  completeTask
);

// Delete Task - Admin only
router.delete(
  "/:id",
  protect,
  authorize("admin"),
  deleteTask
);

module.exports = router;