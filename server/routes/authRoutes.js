const express = require("express");

const {
  registerUser,
  loginUser,
  getProfile,
  adminDashboard,
} = require("../controllers/authController");

const { protect } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/roleMiddleware");

const router = express.Router();

router.post("/register", registerUser);

router.post("/login", loginUser);

router.get("/profile", protect, getProfile);

// Admin only route
router.get("/admin", protect, adminOnly, adminDashboard);

module.exports = router;