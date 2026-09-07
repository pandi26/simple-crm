const express = require("express");

const router = express.Router();

const {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
} = require("../controllers/customerController");

const { protect } = require("../middleware/authMiddleware");

// Create
router.post("/", protect, createCustomer);

// Get All
router.get("/", protect, getCustomers);

// Get Single
router.get("/:id", protect, getCustomerById);

// Update
router.put("/:id", protect, updateCustomer);

// Delete
router.delete("/:id", protect, deleteCustomer);

module.exports = router;