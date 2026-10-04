const Customer = require("../models/customer");
const Lead = require("../models/Lead");
const Task = require("../models/Task");
const User = require("../models/User");
const { getCache, setCache } = require("../utils/cache");

const CACHE_TTL = 60;

const getDashboard = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const cacheKey = `dashboard:${userId}`;

    // Check Redis
    const cachedDashboard = await getCache(cacheKey);

    if (cachedDashboard) {
      console.log("Dashboard Cache HIT");

      return res.status(200).json({
        ...cachedDashboard,
        source: "redis",
      });
    }

    console.log("Dashboard Cache MISS");

    // =========================
    // Customer Statistics
    // =========================

    const totalCustomers = await Customer.countDocuments();

    // =========================
    // Lead Statistics
    // =========================

    const totalLeads = await Lead.countDocuments();

    const newLeads = await Lead.countDocuments({
      status: "new",
    });

    const convertedLeads = await Lead.countDocuments({
      status: "converted",
    });

    // =========================
    // Task Statistics
    // =========================

    const totalTasks = await Task.countDocuments();

    const pendingTasks = await Task.countDocuments({
      status: "pending",
    });

    const completedTasks = await Task.countDocuments({
      status: "completed",
    });

    const overdueTasks = await Task.countDocuments({
      dueDate: {
        $lt: new Date(),
      },
      status: {
        $nin: ["completed", "cancelled"],
      },
    });

    // =========================
    // User Statistics
    // =========================

    const totalUsers = await User.countDocuments();

    // =========================
    // Dashboard Response
    // =========================

    const dashboardData = {
      customers: {
        total: totalCustomers,
      },

      leads: {
        total: totalLeads,
        new: newLeads,
        converted: convertedLeads,
      },

      tasks: {
        total: totalTasks,
        pending: pendingTasks,
        completed: completedTasks,
        overdue: overdueTasks,
      },

      users: {
        total: totalUsers,
      },
    };

    // Store in Redis
    await setCache(
      cacheKey,
      dashboardData,
      CACHE_TTL
    );

    return res.status(200).json({
      ...dashboardData,
      source: "mongodb",
    });
  } catch (error) {
    console.error(
      "Dashboard Error:",
      error.message
    );

    return res.status(500).json({
      message: "Failed to load dashboard",
    });
  }
};

module.exports = {
  getDashboard,
};