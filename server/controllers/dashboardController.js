const Customer = require("../models/customer");
const Lead = require("../models/Lead");
const Task = require("../models/Task");
const User = require("../models/User");

const { getCache, setCache } = require("../utils/cache");

const CACHE_TTL = 60;

const getDashboard = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const role = req.user.role;

    const cacheKey = `dashboard:${role}:${userId}`;

    // =========================
    // Redis Cache
    // =========================

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
    // Filters
    // =========================

    const customerFilter = {};
    const leadFilter = {};
    const taskFilter = {};

    // Sales sees only assigned records
    if (role === "sales") {
      customerFilter.assignedTo = req.user._id;
      leadFilter.assignedTo = req.user._id;
      taskFilter.assignedTo = req.user._id;
    }

    // =========================
    // Customers
    // =========================

    const totalCustomers =
      await Customer.countDocuments(customerFilter);

    // =========================
    // Leads
    // =========================

    const totalLeads =
      await Lead.countDocuments(leadFilter);

    const newLeads =
      await Lead.countDocuments({
        ...leadFilter,
        status: "new",
      });

    const convertedLeads =
      await Lead.countDocuments({
        ...leadFilter,
        status: "converted",
      });

    // =========================
    // Tasks
    // =========================

    const totalTasks =
      await Task.countDocuments(taskFilter);

    const pendingTasks =
      await Task.countDocuments({
        ...taskFilter,
        status: "pending",
      });

    const completedTasks =
      await Task.countDocuments({
        ...taskFilter,
        status: "completed",
      });

    const overdueTasks =
      await Task.countDocuments({
        ...taskFilter,
        dueDate: {
          $lt: new Date(),
        },
        status: {
          $nin: ["completed", "cancelled"],
        },
      });

    // =========================
    // Users
    // =========================

    let totalUsers = 0;

    if (role === "admin") {
      totalUsers = await User.countDocuments();
    }

    // =========================
    // Response
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

    // =========================
    // Redis
    // =========================

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