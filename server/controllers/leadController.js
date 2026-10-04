const Lead = require("../models/Lead");
const LeadActivity = require("../models/LeadActivity");

const {
  getCache,
  setCache,
  deleteCache,
} = require("../utils/cache");

const CACHE_TTL = 60;

// ========================================
// Cache Helpers
// ========================================

const getLeadCacheKey = (userId, query) => {
  const {
    search = "",
    status = "",
    source = "",
    page = 1,
    limit = 10,
  } = query;

  return `leads:${userId}:${search}:${status}:${source}:${page}:${limit}`;
};

// Clear all cached lead lists for a user
const clearLeadCache = async (userId) => {
  try {
    const pattern = `leads:${userId}:*`;

    // NOTE:
    // KEYS is acceptable for development.
    // Later we'll replace this with SCAN for production.
    const { redisClient } = require("../config/redis");

    const keys = await redisClient.keys(pattern);

    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch (error) {
    console.error("Clear Lead Cache Error:", error.message);
  }
};

// ========================================
// Create Lead
// ========================================

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

    if (!name || !email || !phone) {
      return res.status(400).json({
        message: "Name, email and phone are required",
      });
    }

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

    // Clear creator cache
    await clearLeadCache(req.user._id.toString());

    // Clear assigned user's cache
    if (assignedTo) {
      await clearLeadCache(assignedTo.toString());
    }

    return res.status(201).json({
      message: "Lead created successfully",
      lead,
    });
  } catch (error) {
    console.error("Create Lead Error:", error.message);

    return res.status(500).json({
      message: "Failed to create lead",
    });
  }
};

// ========================================
// Get All Leads
// ========================================

const getLeads = async (req, res) => {
  try {
    const {
      search = "",
      status = "",
      source = "",
      page = 1,
      limit = 10,
    } = req.query;

    const pageNumber = Number(page);
    const limitNumber = Number(limit);

    // Prevent invalid pagination
    if (
      !Number.isInteger(pageNumber) ||
      !Number.isInteger(limitNumber) ||
      pageNumber < 1 ||
      limitNumber < 1
    ) {
      return res.status(400).json({
        message: "Invalid pagination values",
      });
    }

    const userId = req.user._id.toString();

    const cacheKey = getLeadCacheKey(userId, {
      search,
      status,
      source,
      page: pageNumber,
      limit: limitNumber,
    });

    // ========================================
    // Redis Cache
    // ========================================

    const cachedLeads = await getCache(cacheKey);

    if (cachedLeads) {
      console.log("Leads Cache HIT");

      return res.status(200).json({
        ...cachedLeads,
        source: "redis",
      });
    }

    console.log("Leads Cache MISS");

    // ========================================
    // MongoDB Filter
    // ========================================

    const filter = {};

    // Sales users only see assigned leads
    if (req.user.role === "sales") {
      filter.assignedTo = req.user._id;
    }

    // Search
    if (search) {
      filter.$or = [
        {
          name: {
            $regex: search,
            $options: "i",
          },
        },
        {
          email: {
            $regex: search,
            $options: "i",
          },
        },
        {
          company: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    // Status
    if (status) {
      filter.status = status;
    }

    // Source
    if (source) {
      filter.source = source;
    }

    // ========================================
    // Pagination
    // ========================================

    const skip = (pageNumber - 1) * limitNumber;

    const [leads, total] = await Promise.all([
      Lead.find(filter)
        .populate("assignedTo", "name email role")
        .populate("createdBy", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber)
        .lean(),

      Lead.countDocuments(filter),
    ]);

    const responseData = {
      count: leads.length,
      total,
      page: pageNumber,
      pages: Math.ceil(total / limitNumber),
      leads,
    };

    // ========================================
    // Save to Redis
    // ========================================

    await setCache(
      cacheKey,
      responseData,
      CACHE_TTL
    );

    return res.status(200).json({
      ...responseData,
      source: "mongodb",
    });
  } catch (error) {
    console.error("Get Leads Error:", error.message);

    return res.status(500).json({
      message: "Failed to fetch leads",
    });
  }
};

// ========================================
// Get Lead By ID
// ========================================

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
    console.error("Get Lead By ID Error:", error.message);

    return res.status(500).json({
      message: "Failed to fetch lead",
    });
  }
};

// ========================================
// Update Lead
// ========================================

const updateLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({
        message: "Lead not found",
      });
    }

    // Sales can update only assigned leads
    if (
      req.user.role === "sales" &&
      String(lead.assignedTo) !== String(req.user._id)
    ) {
      return res.status(403).json({
        message: "You can only update your assigned leads",
      });
    }

    // Sales cannot reassign leads
    if (
      req.user.role === "sales" &&
      req.body.assignedTo
    ) {
      return res.status(403).json({
        message: "Sales users cannot reassign leads",
      });
    }

    const oldStatus = lead.status;
    const oldAssignedTo = lead.assignedTo;

    Object.assign(lead, req.body);

    await lead.save();

    // Create activity when status changes
    if (
      req.body.status &&
      req.body.status !== oldStatus
    ) {
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

    // ========================================
    // Clear Relevant Caches
    // ========================================

    await clearLeadCache(
      lead.createdBy.toString()
    );

    if (oldAssignedTo) {
      await clearLeadCache(
        oldAssignedTo.toString()
      );
    }

    if (lead.assignedTo) {
      await clearLeadCache(
        lead.assignedTo.toString()
      );
    }

    return res.status(200).json({
      message: "Lead updated successfully",
      lead: updatedLead,
    });
  } catch (error) {
    console.error("Update Lead Error:", error.message);

    return res.status(500).json({
      message: "Failed to update lead",
    });
  }
};

// ========================================
// Assign Lead
// ========================================

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

    const oldAssignedTo = lead.assignedTo;

    lead.assignedTo = assignedTo;

    await lead.save();

    await LeadActivity.create({
      lead: lead._id,
      user: req.user._id,
      type: "assignment",
      description: `Lead assigned to user ${assignedTo}`,
    });

    const updatedLead = await Lead.findById(lead._id)
      .populate("assignedTo", "name email role")
      .populate("createdBy", "name email");

    // Clear old assignee cache
    if (oldAssignedTo) {
      await clearLeadCache(
        oldAssignedTo.toString()
      );
    }

    // Clear new assignee cache
    await clearLeadCache(
      assignedTo.toString()
    );

    // Clear current user's cache
    await clearLeadCache(
      req.user._id.toString()
    );

    return res.status(200).json({
      message: "Lead assigned successfully",
      lead: updatedLead,
    });
  } catch (error) {
    console.error("Assign Lead Error:", error.message);

    return res.status(500).json({
      message: "Failed to assign lead",
    });
  }
};

// ========================================
// Delete Lead
// ========================================

const deleteLead = async (req, res) => {
  try {
    const lead = await Lead.findByIdAndDelete(
      req.params.id
    );

    if (!lead) {
      return res.status(404).json({
        message: "Lead not found",
      });
    }

    // Clear creator cache
    if (lead.createdBy) {
      await clearLeadCache(
        lead.createdBy.toString()
      );
    }

    // Clear assigned user's cache
    if (lead.assignedTo) {
      await clearLeadCache(
        lead.assignedTo.toString()
      );
    }

    return res.status(200).json({
      message: "Lead deleted successfully",
    });
  } catch (error) {
    console.error("Delete Lead Error:", error.message);

    return res.status(500).json({
      message: "Failed to delete lead",
    });
  }
};

// ========================================
// Exports
// ========================================

module.exports = {
  createLead,
  getLeads,
  getLeadById,
  updateLead,
  deleteLead,
  assignLead,
};