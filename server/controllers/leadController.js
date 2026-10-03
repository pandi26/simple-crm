const Lead = require("../models/Lead");
const LeadActivity = require("../models/LeadActivity");
const { redisClient } = require("../config/redis");

const CACHE_TTL = 60;

// Create a unique cache key for each user + query
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
  const keys = await redisClient.keys(`leads:${userId}:*`);

  if (keys.length > 0) {
    await redisClient.del(keys);
  }
};

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

    // Clear cache for creator
    await clearLeadCache(req.user._id.toString());

    // If assigned to another user, clear their cache too
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
      message: error.message,
    });
  }
};

// Get All Leads
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

    const cacheKey = getLeadCacheKey(req.user._id.toString(), {
      search,
      status,
      source,
      page: pageNumber,
      limit: limitNumber,
    });

    // Check Redis first
    const cachedLeads = await redisClient.get(cacheKey);

    if (cachedLeads) {
      console.log("Leads Cache HIT");

      return res.status(200).json({
        ...JSON.parse(cachedLeads),
        source: "redis",
      });
    }

    console.log("Leads Cache MISS");

    // Build MongoDB filter
    const filter = {};

    // Sales users can only see assigned leads
    if (req.user.role === "sales") {
      filter.assignedTo = req.user._id;
    }

    // Search
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { company: { $regex: search, $options: "i" } },
      ];
    }

    // Status filter
    if (status) {
      filter.status = status;
    }

    // Source filter
    if (source) {
      filter.source = source;
    }

    const skip = (pageNumber - 1) * limitNumber;

    const leads = await Lead.find(filter)
      .populate("assignedTo", "name email role")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber);

    const total = await Lead.countDocuments(filter);

    const responseData = {
      count: leads.length,
      total,
      page: pageNumber,
      pages: Math.ceil(total / limitNumber),
      leads,
    };

    // Store in Redis
    await redisClient.setEx(
      cacheKey,
      CACHE_TTL,
      JSON.stringify(responseData)
    );

    return res.status(200).json({
      ...responseData,
      source: "mongodb",
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
    console.error("Get Lead By ID Error:", error.message);

    return res.status(500).json({
      message: error.message,
    });
  }
};

// Update Lead
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

    // Sales cannot reassign
    if (req.user.role === "sales" && req.body.assignedTo) {
      return res.status(403).json({
        message: "Sales users cannot reassign leads",
      });
    }

    const oldStatus = lead.status;
    const oldAssignedTo = lead.assignedTo;

    Object.assign(lead, req.body);

    await lead.save();

    // Create activity if status changed
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

    // Clear cache for creator
    await clearLeadCache(lead.createdBy.toString());

    // Clear cache for previous assignee
    if (oldAssignedTo) {
      await clearLeadCache(oldAssignedTo.toString());
    }

    // Clear cache for new assignee
    if (lead.assignedTo) {
      await clearLeadCache(lead.assignedTo.toString());
    }

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

    // Clear old and new user's caches
    if (oldAssignedTo) {
      await clearLeadCache(oldAssignedTo.toString());
    }

    await clearLeadCache(assignedTo.toString());

    await clearLeadCache(req.user._id.toString());

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

    // Clear creator cache
    await clearLeadCache(lead.createdBy.toString());

    // Clear assigned user's cache
    if (lead.assignedTo) {
      await clearLeadCache(lead.assignedTo.toString());
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