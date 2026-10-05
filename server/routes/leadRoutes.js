const express = require("express");

const {
  createLead,
  getLeads,
  getLeadById,
  updateLead,
  deleteLead,
  assignLead,
} = require("../controllers/leadController");

const {
  protect,
} = require("../middleware/authMiddleware");

const {
  authorize,
  adminOnly,
} = require("../middleware/roleMiddleware");

const router = express.Router();

// =====================================================
// CREATE LEAD
// Admin + Sales
// =====================================================

router.post(
  "/",
  protect,
  authorize("admin", "sales"),
  createLead
);

// =====================================================
// GET ALL LEADS
// Admin + Sales
// =====================================================

router.get(
  "/",
  protect,
  authorize("admin", "sales"),
  getLeads
);

// =====================================================
// GET SINGLE LEAD
// Admin + Sales
// =====================================================

router.get(
  "/:id",
  protect,
  authorize("admin", "sales"),
  getLeadById
);

// =====================================================
// UPDATE LEAD
// Admin + Sales
// =====================================================

router.put(
  "/:id",
  protect,
  authorize("admin", "sales"),
  updateLead
);

// =====================================================
// ASSIGN / REASSIGN LEAD
// Admin Only
// =====================================================

router.put(
  "/:id/assign",
  protect,
  adminOnly,
  assignLead
);

// =====================================================
// DELETE LEAD
// Admin Only
// =====================================================

router.delete(
  "/:id",
  protect,
  adminOnly,
  deleteLead
);

module.exports = router;