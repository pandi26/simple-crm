const express = require("express");

const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} = require("../controllers/userController");

const { protect } = require("../middleware/authMiddleware");

const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

// Get all users
router.get(
  "/",
  protect,
  authorize("admin"),
  getUsers
);

// Get single user
router.get(
  "/:id",
  protect,
  authorize("admin"),
  getUserById
);

// Create user
router.post(
  "/",
  protect,
  authorize("admin"),
  createUser
);

// Update user
router.put(
  "/:id",
  protect,
  authorize("admin"),
  updateUser
);

// Delete user
router.delete(
  "/:id",
  protect,
  authorize("admin"),
  deleteUser
);

module.exports = router;