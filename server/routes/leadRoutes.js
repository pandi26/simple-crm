const express = require("express");

const router = express.Router();

const {
  createLead,
  getLeads,
  getLeadById,
  updateLead,
  deleteLead,
} = require("../controllers/leadController");

const { protect } = require("../middleware/authMiddleware");

// Create Lead
router.post("/", protect, createLead);

// Get All Leads
router.get("/", protect, getLeads);

// Get Single Lead
router.get("/:id", protect, getLeadById);

// Update Lead
router.put("/:id", protect, updateLead);

// Delete Lead
router.delete("/:id", protect, deleteLead);

module.exports = router;