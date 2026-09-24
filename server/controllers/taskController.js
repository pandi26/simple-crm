const Task = require("../models/Task");
const Lead = require("../models/Lead");
const User = require("../models/User");

// Create Task
const createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      lead,
      assignedTo,
      dueDate,
      priority,
    } = req.body;

    // Check required fields
    if (!title || !lead || !assignedTo || !dueDate) {
      return res.status(400).json({
        message: "Title, lead, assignedTo and dueDate are required",
      });
    }

    // Check lead exists
    const leadExists = await Lead.findById(lead);

    if (!leadExists) {
      return res.status(404).json({
        message: "Lead not found",
      });
    }

    // Check assigned user exists
    const userExists = await User.findById(assignedTo);

    if (!userExists) {
      return res.status(404).json({
        message: "Assigned user not found",
      });
    }

    // Only admin can assign task to another user
    if (
      req.user.role === "sales" &&
      String(assignedTo) !== String(req.user._id)
    ) {
      return res.status(403).json({
        message: "Sales users can only create tasks for themselves",
      });
    }

    // Create task
    const task = await Task.create({
      title,
      description,
      lead,
      assignedTo,
      dueDate,
      priority,
      createdBy: req.user._id,
    });

    // Return populated task
    const populatedTask = await Task.findById(task._id)
      .populate("lead", "name email company")
      .populate("assignedTo", "name email role")
      .populate("createdBy", "name email role");

    return res.status(201).json({
      message: "Task created successfully",
      task: populatedTask,
    });

  } catch (error) {
    console.error("Create Task Error:", error.message);

    return res.status(500).json({
      message: error.message,
    });
  }
};

// Get Tasks
// Get Tasks
const getTasks = async (req, res) => {
  try {
    const {
      status,
      priority,
      overdue,
    } = req.query;

    const filter = {};

    // Sales users can only see their own tasks
    if (req.user.role === "sales") {
      filter.assignedTo = req.user._id;
    }

    // Filter by status
    if (status) {
      filter.status = status;
    }

    // Filter by priority
    if (priority) {
      filter.priority = priority;
    }

    // Filter overdue tasks
    if (overdue === "true") {
      filter.dueDate = {
        $lt: new Date(),
      };

      // Don't show completed/cancelled as overdue
      filter.status = {
        $nin: ["completed", "cancelled"],
      };
    }

    const tasks = await Task.find(filter)
      .populate("lead", "name email company")
      .populate("assignedTo", "name email role")
      .populate("createdBy", "name email role")
      .sort({ dueDate: 1 });

    return res.status(200).json({
      count: tasks.length,
      tasks,
    });

  } catch (error) {
    console.error("Get Tasks Error:", error.message);

    return res.status(500).json({
      message: error.message,
    });
  }
};

// Get Single Task
const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate("lead", "name email company")
      .populate("assignedTo", "name email role")
      .populate("createdBy", "name email role");

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    // Sales can only view their own task
    if (
      req.user.role === "sales" &&
      String(task.assignedTo._id) !== String(req.user._id)
    ) {
      return res.status(403).json({
        message: "You can only view your own tasks",
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


// Update Task
const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    // Sales can only update their own task
    if (
      req.user.role === "sales" &&
      String(task.assignedTo) !== String(req.user._id)
    ) {
      return res.status(403).json({
        message: "You can only update your own tasks",
      });
    }

    // Sales cannot change task assignment
    if (
      req.user.role === "sales" &&
      req.body.assignedTo
    ) {
      return res.status(403).json({
        message: "Sales users cannot reassign tasks",
      });
    }

    // Update task
    Object.assign(task, req.body);

    await task.save();

    const updatedTask = await Task.findById(task._id)
      .populate("lead", "name email company")
      .populate("assignedTo", "name email role")
      .populate("createdBy", "name email role");

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

// Delete Task
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    // Only admin can delete tasks
    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Only admin can delete tasks",
      });
    }

    await Task.findByIdAndDelete(req.params.id);

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

// Complete Task
const completeTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    // Sales can only complete their own tasks
    if (
      req.user.role === "sales" &&
      String(task.assignedTo) !== String(req.user._id)
    ) {
      return res.status(403).json({
        message: "You can only complete your own tasks",
      });
    }

    task.status = "completed";

    await task.save();

    const updatedTask = await Task.findById(task._id)
      .populate("lead", "name email company")
      .populate("assignedTo", "name email role")
      .populate("createdBy", "name email role");

    return res.status(200).json({
      message: "Task completed successfully",
      task: updatedTask,
    });
  } catch (error) {
    console.error("Complete Task Error:", error.message);

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