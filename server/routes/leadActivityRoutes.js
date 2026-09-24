const express = require("express");

const {
  createActivity,
  getActivities,
} = require("../controllers/leadActivityController");

const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

router.post(
  "/:id/activities",
  protect,
  authorize("admin", "sales"),
  createActivity
);

router.get(
  "/:id/activities",
  protect,
  authorize("admin", "sales"),
  getActivities
);

module.exports = router;