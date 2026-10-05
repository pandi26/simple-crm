  const Lead = require("../models/Lead");
  const LeadActivity = require("../models/LeadActivity");
  const User = require("../models/User");

  const {
    getCache,
    setCache,
    deleteCache,
  } = require("../utils/cache");

  const CACHE_TTL = 60;

  // =====================================================
  // CACHE HELPERS
  // =====================================================

  const getLeadCacheKey = (userId, role, query) => {
    const {
      search = "",
      status = "",
      source = "",
      page = 1,
      limit = 10,
    } = query;

    return `leads:${role}:${userId}:${search}:${status}:${source}:${page}:${limit}`;
  };

  const clearLeadCache = async (userId) => {
    try {
      const { redisClient } = require("../config/redis");

      const pattern = `leads:*:${userId}:*`;

      const keys = await redisClient.keys(pattern);

      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    } catch (error) {
      console.error(
        "Clear Lead Cache Error:",
        error.message
      );
    }
  };

  // =====================================================
  // CREATE LEAD
  // =====================================================

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

      // Validation
      if (!name || !email || !phone) {
        return res.status(400).json({
          message: "Name, email and phone are required",
        });
      }

      // -----------------------------------------------
      // Determine assignment
      // -----------------------------------------------

      let finalAssignedTo = assignedTo;

      // Sales can only create a lead for themselves
      if (req.user.role === "sales") {
        finalAssignedTo = req.user._id;
      }

      // If admin doesn't select a user,
      // assign the lead to admin
      if (!finalAssignedTo) {
        finalAssignedTo = req.user._id;
      }

      // -----------------------------------------------
      // Validate assigned user
      // -----------------------------------------------

      const assignedUser = await User.findById(
        finalAssignedTo
      );

      if (!assignedUser) {
        return res.status(404).json({
          message: "Assigned user not found",
        });
      }

      // -----------------------------------------------
      // Create Lead
      // -----------------------------------------------

      const lead = await Lead.create({
        name,
        email,
        phone,
        company,
        source,
        status,
        value,
        assignedTo: finalAssignedTo,
        createdBy: req.user._id,
      });

      // -----------------------------------------------
      // Create activity
      // -----------------------------------------------

      await LeadActivity.create({
        lead: lead._id,
        user: req.user._id,
        type: "assignment",
        description: `Lead assigned to ${assignedUser.name}`,
      });

      // -----------------------------------------------
      // Clear caches
      // -----------------------------------------------

      await clearLeadCache(
        req.user._id.toString()
      );

      await clearLeadCache(
        finalAssignedTo.toString()
      );

      // -----------------------------------------------
      // Populate response
      // -----------------------------------------------

      const populatedLead = await Lead.findById(
        lead._id
      )
        .populate(
          "assignedTo",
          "name email role"
        )
        .populate(
          "createdBy",
          "name email role"
        );

      return res.status(201).json({
        message: "Lead created successfully",
        lead: populatedLead,
      });
    } catch (error) {
      console.error(
        "Create Lead Error:",
        error.message
      );

      return res.status(500).json({
        message: "Failed to create lead",
      });
    }
  };

  // =====================================================
  // GET ALL LEADS
  // =====================================================

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

      // -----------------------------------------------
      // Validate pagination
      // -----------------------------------------------

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
      const role = req.user.role;

      // -----------------------------------------------
      // Redis cache
      // -----------------------------------------------

      const cacheKey = getLeadCacheKey(
        userId,
        role,
        {
          search,
          status,
          source,
          page: pageNumber,
          limit: limitNumber,
        }
      );

      const cachedLeads = await getCache(cacheKey);

      if (cachedLeads) {
        console.log("Leads Cache HIT");

        return res.status(200).json({
          ...cachedLeads,
          source: "redis",
        });
      }

      console.log("Leads Cache MISS");

      // -----------------------------------------------
      // MongoDB filter
      // -----------------------------------------------

      const filter = {};

      // Sales only see their assigned leads
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

      // -----------------------------------------------
      // Pagination
      // -----------------------------------------------

      const skip =
        (pageNumber - 1) * limitNumber;

      // -----------------------------------------------
      // Fetch leads + total
      // -----------------------------------------------

      const [leads, total] =
        await Promise.all([
          Lead.find(filter)
            .populate(
              "assignedTo",
              "name email role"
            )
            .populate(
              "createdBy",
              "name email role"
            )
            .sort({
              createdAt: -1,
            })
            .skip(skip)
            .limit(limitNumber)
            .lean(),

          Lead.countDocuments(filter),
        ]);

      // -----------------------------------------------
      // Response
      // -----------------------------------------------

      const responseData = {
        count: leads.length,
        total,
        page: pageNumber,
        pages: Math.ceil(
          total / limitNumber
        ),
        leads,
      };

      // -----------------------------------------------
      // Save Redis cache
      // -----------------------------------------------

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
      console.error(
        "Get Leads Error:",
        error.message
      );

      return res.status(500).json({
        message: "Failed to fetch leads",
      });
    }
  };

  // =====================================================
  // GET SINGLE LEAD
  // =====================================================

  const getLeadById = async (req, res) => {
    try {
      const lead = await Lead.findById(
        req.params.id
      )
        .populate(
          "assignedTo",
          "name email role"
        )
        .populate(
          "createdBy",
          "name email role"
        );

      if (!lead) {
        return res.status(404).json({
          message: "Lead not found",
        });
      }

      // -----------------------------------------------
      // Sales ownership check
      // -----------------------------------------------

      if (
        req.user.role === "sales" &&
        String(lead.assignedTo?._id) !==
          String(req.user._id)
      ) {
        return res.status(403).json({
          message:
            "You can only view your assigned leads",
        });
      }

      return res.status(200).json({
        lead,
      });
    } catch (error) {
      console.error(
        "Get Lead By ID Error:",
        error.message
      );

      return res.status(500).json({
        message: "Failed to fetch lead",
      });
    }
  };

  // =====================================================
  // UPDATE LEAD
  // =====================================================

  const updateLead = async (req, res) => {
    try {
      const lead = await Lead.findById(
        req.params.id
      );

      if (!lead) {
        return res.status(404).json({
          message: "Lead not found",
        });
      }

      // -----------------------------------------------
      // Sales ownership check
      // -----------------------------------------------

      if (
        req.user.role === "sales" &&
        String(lead.assignedTo) !==
          String(req.user._id)
      ) {
        return res.status(403).json({
          message:
            "You can only update your assigned leads",
        });
      }

      // -----------------------------------------------
      // Sales cannot reassign
      // -----------------------------------------------

      if (
        req.user.role === "sales" &&
        req.body.assignedTo
      ) {
        return res.status(403).json({
          message:
            "Sales users cannot reassign leads",
        });
      }

      // -----------------------------------------------
      // Save old values
      // -----------------------------------------------

      const oldStatus = lead.status;
      const oldAssignedTo =
        lead.assignedTo;

      // -----------------------------------------------
      // Admin assignment validation
      // -----------------------------------------------

      if (
        req.body.assignedTo &&
        req.user.role === "admin"
      ) {
        const assignedUser =
          await User.findById(
            req.body.assignedTo
          );

        if (!assignedUser) {
          return res.status(404).json({
            message:
              "Assigned user not found",
          });
        }

        lead.assignedTo =
          req.body.assignedTo;
      }

      // -----------------------------------------------
      // Update allowed fields
      // -----------------------------------------------

      if (req.body.name !== undefined) {
        lead.name = req.body.name;
      }

      if (req.body.email !== undefined) {
        lead.email = req.body.email;
      }

      if (req.body.phone !== undefined) {
        lead.phone = req.body.phone;
      }

      if (req.body.company !== undefined) {
        lead.company = req.body.company;
      }

      if (req.body.source !== undefined) {
        lead.source = req.body.source;
      }

      if (req.body.status !== undefined) {
        lead.status = req.body.status;
      }

      if (req.body.value !== undefined) {
        lead.value = req.body.value;
      }

      await lead.save();

      // -----------------------------------------------
      // Status activity
      // -----------------------------------------------

      if (
        req.body.status &&
        req.body.status !== oldStatus
      ) {
        await LeadActivity.create({
          lead: lead._id,
          user: req.user._id,
          type: "status_change",
          description:
            `Status changed from ${oldStatus} to ${lead.status}`,
        });
      }

      // -----------------------------------------------
      // Assignment activity
      // -----------------------------------------------

      if (
        req.body.assignedTo &&
        String(req.body.assignedTo) !==
          String(oldAssignedTo)
      ) {
        await LeadActivity.create({
          lead: lead._id,
          user: req.user._id,
          type: "assignment",
          description:
            `Lead reassigned to ${req.body.assignedTo}`,
        });
      }

      // -----------------------------------------------
      // Clear caches
      // -----------------------------------------------

      if (lead.createdBy) {
        await clearLeadCache(
          lead.createdBy.toString()
        );
      }

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

      // Current user
      await clearLeadCache(
        req.user._id.toString()
      );

      // -----------------------------------------------
      // Populate updated lead
      // -----------------------------------------------

      const updatedLead =
        await Lead.findById(lead._id)
          .populate(
            "assignedTo",
            "name email role"
          )
          .populate(
            "createdBy",
            "name email role"
          );

      return res.status(200).json({
        message:
          "Lead updated successfully",
        lead: updatedLead,
      });
    } catch (error) {
      console.error(
        "Update Lead Error:",
        error.message
      );

      return res.status(500).json({
        message: "Failed to update lead",
      });
    }
  };

  // =====================================================
  // ASSIGN LEAD
  // ADMIN ONLY
  // =====================================================

  const assignLead = async (req, res) => {
    try {
      const { assignedTo } =
        req.body;

      if (!assignedTo) {
        return res.status(400).json({
          message:
            "assignedTo is required",
        });
      }

      // -----------------------------------------------
      // Check user
      // -----------------------------------------------

      const assignedUser =
        await User.findById(
          assignedTo
        );

      if (!assignedUser) {
        return res.status(404).json({
          message:
            "Assigned user not found",
        });
      }

      const lead = await Lead.findById(
        req.params.id
      );

      if (!lead) {
        return res.status(404).json({
          message: "Lead not found",
        });
      }

      const oldAssignedTo =
        lead.assignedTo;

      // -----------------------------------------------
      // Assign
      // -----------------------------------------------

      lead.assignedTo =
        assignedTo;

      await lead.save();

      // -----------------------------------------------
      // Activity
      // -----------------------------------------------

      await LeadActivity.create({
        lead: lead._id,
        user: req.user._id,
        type: "assignment",
        description:
          `Lead assigned to ${assignedUser.name}`,
      });

      // -----------------------------------------------
      // Clear caches
      // -----------------------------------------------

      if (oldAssignedTo) {
        await clearLeadCache(
          oldAssignedTo.toString()
        );
      }

      await clearLeadCache(
        assignedTo.toString()
      );

      await clearLeadCache(
        req.user._id.toString()
      );

      if (lead.createdBy) {
        await clearLeadCache(
          lead.createdBy.toString()
        );
      }

      // -----------------------------------------------
      // Response
      // -----------------------------------------------

      const updatedLead =
        await Lead.findById(lead._id)
          .populate(
            "assignedTo",
            "name email role"
          )
          .populate(
            "createdBy",
            "name email role"
          );

      return res.status(200).json({
        message:
          "Lead assigned successfully",
        lead: updatedLead,
      });
    } catch (error) {
      console.error(
        "Assign Lead Error:",
        error.message
      );

      return res.status(500).json({
        message: "Failed to assign lead",
      });
    }
  };

  // =====================================================
  // DELETE LEAD
  // ADMIN ONLY
  // =====================================================

  const deleteLead = async (req, res) => {
    try {
      const lead =
        await Lead.findById(
          req.params.id
        );

      if (!lead) {
        return res.status(404).json({
          message: "Lead not found",
        });
      }

      // -----------------------------------------------
      // Delete
      // -----------------------------------------------

      await Lead.findByIdAndDelete(
        req.params.id
      );

      // -----------------------------------------------
      // Delete related activities
      // -----------------------------------------------

      await LeadActivity.deleteMany({
        lead: lead._id,
      });

      // -----------------------------------------------
      // Clear caches
      // -----------------------------------------------

      if (lead.createdBy) {
        await clearLeadCache(
          lead.createdBy.toString()
        );
      }

      if (lead.assignedTo) {
        await clearLeadCache(
          lead.assignedTo.toString()
        );
      }

      await clearLeadCache(
        req.user._id.toString()
      );

      return res.status(200).json({
        message:
          "Lead deleted successfully",
      });
    } catch (error) {
      console.error(
        "Delete Lead Error:",
        error.message
      );

      return res.status(500).json({
        message: "Failed to delete lead",
      });
    }
  };

  // =====================================================
  // EXPORTS
  // =====================================================

  module.exports = {
    createLead,
    getLeads,
    getLeadById,
    updateLead,
    deleteLead,
    assignLead,
  };