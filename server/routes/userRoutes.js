const express = require("express");

const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} = require("../controllers/userController");

const {
  protect,
} = require("../middleware/authMiddleware");

const {
  adminOnly,
} = require("../middleware/roleMiddleware");

const router = express.Router();

// Get all users
router.get(
  "/",
  protect,
  adminOnly,
  getUsers
);

// Get single user
router.get(
  "/:id",
  protect,
  adminOnly,
  getUserById
);

// Create user
router.post(
  "/",
  protect,
  adminOnly,
  createUser
);

// Update user
router.put(
  "/:id",
  protect,
  adminOnly,
  updateUser
);

// Delete user
router.delete(
  "/:id",
  protect,
  adminOnly,
  deleteUser
);

module.exports = router;