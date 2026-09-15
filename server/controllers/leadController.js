const Lead = require("../models/Lead");

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

    // Get leads
    const leads = await Lead.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber);

    // Total matching leads
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
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({
        message: "Lead not found",
      });
    }

    return res.status(200).json({
      lead,
    });

  } catch (error) {
    console.error("Get Lead Error:", error.message);

    return res.status(500).json({
      message: error.message,
    });
  }
};
// Update Lead
const updateLead = async (req, res) => {
  try {
    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!lead) {
      return res.status(404).json({
        message: "Lead not found",
      });
    }

    return res.status(200).json({
      message: "Lead updated successfully",
      lead,
    });

  } catch (error) {
    console.error("Update Lead Error:", error.message);

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
};