const LeadActivity = require("../models/LeadActivity");
const Lead = require("../models/Lead");

const createActivity = async (req, res) => {
  try {
    const { type, description } = req.body;
    const leadId = req.params.id;

    if (!description || !description.trim()) {
      return res.status(400).json({
        message: "Activity description is required",
      });
    }

    const lead = await Lead.findById(leadId);

    if (!lead) {
      return res.status(404).json({
        message: "Lead not found",
      });
    }

    if (
      req.user.role === "sales" &&
      lead.assignedTo?.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        message: "You can only add activities to your assigned leads",
      });
    }

    const activity = await LeadActivity.create({
      lead: leadId,
      user: req.user._id,
      type: type || "note",
      description: description.trim(),
    });

    await activity.populate("user", "name email role");

    return res.status(201).json({
      message: "Activity created successfully",
      activity,
    });
  } catch (error) {
    console.error("Create Activity Error:", error);

    return res.status(500).json({
      message: error.message,
    });
  }
};

const getActivities = async (req, res) => {
  try {
    const leadId = req.params.id;

    const lead = await Lead.findById(leadId);

    if (!lead) {
      return res.status(404).json({
        message: "Lead not found",
      });
    }

    if (
      req.user.role === "sales" &&
      lead.assignedTo?.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        message: "You can only view activities for your assigned leads",
      });
    }

    const activities = await LeadActivity.find({
      lead: leadId,
    })
      .populate("user", "name email role")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      activities,
    });
  } catch (error) {
    console.error("Get Activities Error:", error);

    return res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  createActivity,
  getActivities,
};