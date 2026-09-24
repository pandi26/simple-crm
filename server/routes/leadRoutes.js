const express = require("express");

const {
  createLead,
  getLeads,
  getLeadById,
  updateLead,
  deleteLead,
  assignLead,
} = require("../controllers/leadController");

const { protect } = require("../middleware/authMiddleware");
const { authorize, adminOnly } = require("../middleware/roleMiddleware");

const router = express.Router();

router.post(
  "/",
  protect,
  authorize("admin", "sales"),
  createLead
);

router.get(
  "/",
  protect,
  authorize("admin", "sales"),
  getLeads
);

router.get(
  "/:id",
  protect,
  authorize("admin", "sales"),
  getLeadById
);

router.put(
  "/:id",
  protect,
  authorize("admin", "sales"),
  updateLead
);

router.put(
  "/:id/assign",
  protect,
  adminOnly,
  assignLead
);

router.delete(
  "/:id",
  protect,
  adminOnly,
  deleteLead
);

module.exports = router;