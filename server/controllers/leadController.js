const Lead = require("../models/Lead");
const LeadActivity = require("../models/LeadActivity");

// Create Lead
const createLead = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      company,
      source,
      status,
      value,
      assignedTo,
    } = req.body;

    // Check required fields
    if (!name || !email || !phone) {
      return res.status(400).json({
        message: "Name, email and phone are required",
      });
    }

    // Create lead
    const lead = await Lead.create({
      name,
      email,
      phone,
      company,
      source,
      status,
      value,
      assignedTo,
      createdBy: req.user._id,
    });

    return res.status(201).json({
      message: "Lead created successfully",
      lead,
    });

  } catch (error) {
    console.error("Create Lead Error:", error.message);

    return res.status(500).json({
      message: error.message,
    });
  }
};

// Get All Leads
const getLeads = async (req, res) => {
  try {
    const {
      search,
      status,
      source,
      page = 1,
      limit = 10,
    } = req.query;

    // Build filter
    const filter = {};

    // Sales users can only see their assigned leads
    if (req.user.role === "sales") {
      filter.assignedTo = req.user._id;
    }

    // Search by name, email or company
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { company: { $regex: search, $options: "i" } },
      ];
    }

    // Filter by status
    if (status) {
      filter.status = status;
    }

    // Filter by source
    if (source) {
      filter.source = source;
    }

    // Pagination
    const pageNumber = Number(page);
    const limitNumber = Number(limit);

    const skip = (pageNumber - 1) * limitNumber;

    const leads = await Lead.find(filter)
      .populate("assignedTo", "name email role")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber);

    const total = await Lead.countDocuments(filter);

    return res.status(200).json({
      count: leads.length,
      total,
      page: pageNumber,
      pages: Math.ceil(total / limitNumber),
      leads,
    });

  } catch (error) {
    console.error("Get Leads Error:", error.message);

    return res.status(500).json({
      message: error.message,
    });
  }
};

// Get Single Lead
const getLeadById = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id)
      .populate("assignedTo", "name email role")
      .populate("createdBy", "name email");

    if (!lead) {
      return res.status(404).json({
        message: "Lead not found",
      });
    }

    return res.status(200).json({
      lead,
    });
  } catch (error) {
    console.error("Get Lead By ID Error:", error);

    return res.status(500).json({
      message: error.message,
    });
  }
};




// Update Lead
// Update Lead
const updateLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({
        message: "Lead not found",
      });
    }

    // Sales can update only their assigned leads
    if (
      req.user.role === "sales" &&
      String(lead.assignedTo) !== String(req.user._id)
    ) {
      return res.status(403).json({
        message: "You can only update your assigned leads",
      });
    }

    // Sales cannot change assignment
    if (
      req.user.role === "sales" &&
      req.body.assignedTo
    ) {
      return res.status(403).json({
        message: "Sales users cannot reassign leads",
      });
    }

    // Store old status
    const oldStatus = lead.status;

    // Update lead
    Object.assign(lead, req.body);

    await lead.save();

    // Check whether status changed
    if (req.body.status && req.body.status !== oldStatus) {
      await LeadActivity.create({
        lead: lead._id,
        user: req.user._id,
        type: "status_change",
        description: `Status changed from ${oldStatus} to ${lead.status}`,
      });
    }

    const updatedLead = await Lead.findById(lead._id)
      .populate("assignedTo", "name email role")
      .populate("createdBy", "name email");

    return res.status(200).json({
      message: "Lead updated successfully",
      lead: updatedLead,
    });
  } catch (error) {
    console.error("Update Lead Error:", error.message);

    return res.status(500).json({
      message: error.message,
    });
  }
};


// Assign Lead to a User
// Assign Lead
const assignLead = async (req, res) => {
  try {
    const { assignedTo } = req.body;

    if (!assignedTo) {
      return res.status(400).json({
        message: "assignedTo is required",
      });
    }

    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({
        message: "Lead not found",
      });
    }

    // Save assigned user
    lead.assignedTo = assignedTo;

    await lead.save();

    // Create automatic activity
    await LeadActivity.create({
      lead: lead._id,
      user: req.user._id,
      type: "assignment",
      description: `Lead assigned to user ${assignedTo}`,
    });

    const updatedLead = await Lead.findById(lead._id)
      .populate("assignedTo", "name email role")
      .populate("createdBy", "name email");

    return res.status(200).json({
      message: "Lead assigned successfully",
      lead: updatedLead,
    });
  } catch (error) {
    console.error("Assign Lead Error:", error.message);

    return res.status(500).json({
      message: error.message,
    });
  }
};

// Delete Lead
const deleteLead = async (req, res) => {
  try {
    const lead = await Lead.findByIdAndDelete(req.params.id);

    if (!lead) {
      return res.status(404).json({
        message: "Lead not found",
      });
    }

    return res.status(200).json({
      message: "Lead deleted successfully",
    });

  } catch (error) {
    console.error("Delete Lead Error:", error.message);

    return res.status(500).json({
      message: error.message,
    });
  }
};
module.exports = {
  createLead,
  getLeads,
  getLeadById,
  updateLead,
  deleteLead,
  assignLead,
};