const Task = require("../models/Task");
const { getCache, setCache, deleteCache } = require("../utils/cache");

const CACHE_TTL = 60;

// Generate unique cache key
const getTaskCacheKey = (userId, query) => {
  const {
    status = "",
    priority = "",
    page = 1,
    limit = 10,
  } = query;

  return `tasks:${userId}:${status}:${priority}:${page}:${limit}`;
};

// Clear all task cache for one user
const clearTaskCache = async (userId) => {
  try {
    const { redisClient } = require("../config/redis");

    const keys = await redisClient.keys(`tasks:${userId}:*`);

    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch (error) {
    console.error("Clear Task Cache Error:", error.message);
  }
};

// =========================
// Create Task
// =========================

const createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      dueDate,
      priority,
      assignedTo,
      status,
    } = req.body;

    if (!title) {
      return res.status(400).json({
        message: "Title is required",
      });
    }

    const task = await Task.create({
      title,
      description,
      dueDate,
      priority,
      assignedTo,
      status,
      createdBy: req.user._id,
    });

    // Clear creator cache
    await clearTaskCache(req.user._id.toString());

    // Clear assigned user's cache
    if (assignedTo) {
      await clearTaskCache(assignedTo.toString());
    }

    return res.status(201).json({
      message: "Task created successfully",
      task,
    });
  } catch (error) {
    console.error("Create Task Error:", error.message);

    return res.status(500).json({
      message: error.message,
    });
  }
};

// =========================
// Get All Tasks
// =========================

const getTasks = async (req, res) => {
  try {
    const {
      status = "",
      priority = "",
      page = 1,
      limit = 10,
    } = req.query;

    const pageNumber = Number(page);
    const limitNumber = Number(limit);

    const cacheKey = getTaskCacheKey(
      req.user._id.toString(),
      {
        status,
        priority,
        page: pageNumber,
        limit: limitNumber,
      }
    );

    // Check Redis
    const cachedTasks = await getCache(cacheKey);

    if (cachedTasks) {
      console.log("Tasks Cache HIT");

      return res.status(200).json({
        ...cachedTasks,
        source: "redis",
      });
    }

    console.log("Tasks Cache MISS");

    // MongoDB filter
    const filter = {};

    // Sales can only see their tasks
    if (req.user.role === "sales") {
      filter.assignedTo = req.user._id;
    }

    if (status) {
      filter.status = status;
    }

    if (priority) {
      filter.priority = priority;
    }

    const skip = (pageNumber - 1) * limitNumber;

    const tasks = await Task.find(filter)
      .populate("assignedTo", "name email role")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber)
      .lean();

    const total = await Task.countDocuments(filter);

    const responseData = {
      count: tasks.length,
      total,
      page: pageNumber,
      pages: Math.ceil(total / limitNumber),
      tasks,
    };

    // Save to Redis
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
    console.error("Get Tasks Error:", error.message);

    return res.status(500).json({
      message: error.message,
    });
  }
};

// =========================
// Get Task By ID
// =========================

const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate("assignedTo", "name email role")
      .populate("createdBy", "name email");

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    return res.status(200).json({
      task,
    });
  } catch (error) {
    console.error("Get Task Error:", error.message);

    return res.status(500).json({
      message: error.message,
    });
  }
};

// =========================
// Update Task
// =========================

const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    const oldAssignedTo = task.assignedTo;

    Object.assign(task, req.body);

    await task.save();

    // Clear creator cache
    if (task.createdBy) {
      await clearTaskCache(
        task.createdBy.toString()
      );
    }

    // Clear old assigned user's cache
    if (oldAssignedTo) {
      await clearTaskCache(
        oldAssignedTo.toString()
      );
    }

    // Clear new assigned user's cache
    if (task.assignedTo) {
      await clearTaskCache(
        task.assignedTo.toString()
      );
    }

    const updatedTask = await Task.findById(task._id)
      .populate("assignedTo", "name email role")
      .populate("createdBy", "name email");

    return res.status(200).json({
      message: "Task updated successfully",
      task: updatedTask,
    });
  } catch (error) {
    console.error("Update Task Error:", error.message);

    return res.status(500).json({
      message: error.message,
    });
  }
};

// =========================
// Complete Task
// =========================

const completeTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    task.status = "completed";

    await task.save();

    // Clear cache
    if (task.createdBy) {
      await clearTaskCache(
        task.createdBy.toString()
      );
    }

    if (task.assignedTo) {
      await clearTaskCache(
        task.assignedTo.toString()
      );
    }

    return res.status(200).json({
      message: "Task completed successfully",
      task,
    });
  } catch (error) {
    console.error("Complete Task Error:", error.message);

    return res.status(500).json({
      message: error.message,
    });
  }
};

// =========================
// Delete Task
// =========================

const deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(
      req.params.id
    );

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    // Clear creator cache
    if (task.createdBy) {
      await clearTaskCache(
        task.createdBy.toString()
      );
    }

    // Clear assigned user's cache
    if (task.assignedTo) {
      await clearTaskCache(
        task.assignedTo.toString()
      );
    }

    return res.status(200).json({
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.error("Delete Task Error:", error.message);

    return res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  completeTask,
};