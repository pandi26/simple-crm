const Customer = require("../models/customer");

const {
  getCache,
  setCache,
  deleteCache,
} = require("../utils/cache");

const CACHE_TTL = 60;

// =========================
// Cache Key
// =========================

const getCustomerCacheKey = (userId, role) => {
  return `customers:${role}:${userId}`;
};

// =========================
// Clear Customer Cache
// =========================

const clearCustomerCache = async (userId, role) => {
  try {
    await deleteCache(
      getCustomerCacheKey(userId, role)
    );
  } catch (error) {
    console.error(
      "Clear Customer Cache Error:",
      error.message
    );
  }
};

// =========================
// Create Customer
// =========================

const createCustomer = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      company,
      status,
      assignedTo,
    } = req.body;

    if (!name || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: "Name, email and phone are required",
      });
    }

    // Sales can only assign customer to themselves
    if (
      req.user.role === "sales" &&
      assignedTo &&
      String(assignedTo) !== String(req.user._id)
    ) {
      return res.status(403).json({
        success: false,
        message: "Sales users can only assign customers to themselves",
      });
    }

    const customer = await Customer.create({
      name,
      email,
      phone,
      company,
      status,
      assignedTo: assignedTo || req.user._id,
      createdBy: req.user._id,
    });

    // Clear creator's cache
    await clearCustomerCache(
      req.user._id.toString(),
      req.user.role
    );

    // If admin assigned customer to sales user,
    // clear that user's cache too
    if (assignedTo) {
      await clearCustomerCache(
        assignedTo.toString(),
        "sales"
      );
    }

    const populatedCustomer =
      await Customer.findById(customer._id)
        .populate("assignedTo", "name email role")
        .populate("createdBy", "name email role");

    return res.status(201).json({
      success: true,
      message: "Customer created successfully",
      customer: populatedCustomer,
    });

  } catch (error) {
    console.error(
      "Create Customer Error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =========================
// Get All Customers
// =========================

const getCustomers = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const role = req.user.role;

    const cacheKey = getCustomerCacheKey(
      userId,
      role
    );

    // Redis
    const cachedCustomers = await getCache(cacheKey);

    if (cachedCustomers) {
      console.log("Customers Cache HIT");

      return res.status(200).json({
        success: true,
        count: cachedCustomers.length,
        customers: cachedCustomers,
        source: "redis",
      });
    }

    console.log("Customers Cache MISS");

    // Filter
    const filter = {};

    // Sales sees only assigned customers
    if (role === "sales") {
      filter.assignedTo = req.user._id;
    }

    const customers = await Customer.find(filter)
      .populate("assignedTo", "name email role")
      .populate("createdBy", "name email role")
      .sort({ createdAt: -1 })
      .lean();

    // Redis
    await setCache(
      cacheKey,
      customers,
      CACHE_TTL
    );

    return res.status(200).json({
      success: true,
      count: customers.length,
      customers,
      source: "mongodb",
    });

  } catch (error) {
    console.error(
      "Get Customers Error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =========================
// Get Customer By ID
// =========================

const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(
      req.params.id
    )
      .populate("assignedTo", "name email role")
      .populate("createdBy", "name email role");

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // Sales can only view assigned customers
    if (
      req.user.role === "sales" &&
      String(customer.assignedTo?._id) !==
        String(req.user._id)
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only view your assigned customers",
      });
    }

    return res.status(200).json({
      success: true,
      customer,
    });

  } catch (error) {
    console.error(
      "Get Customer By ID Error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =========================
// Update Customer
// =========================

const updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(
      req.params.id
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // Sales can only update assigned customers
    if (
      req.user.role === "sales" &&
      String(customer.assignedTo) !==
        String(req.user._id)
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only update your assigned customers",
      });
    }

    // Sales cannot reassign
    if (
      req.user.role === "sales" &&
      req.body.assignedTo
    ) {
      return res.status(403).json({
        success: false,
        message: "Sales users cannot reassign customers",
      });
    }

    const {
      name,
      email,
      phone,
      company,
      status,
      assignedTo,
    } = req.body;

    customer.name =
      name ?? customer.name;

    customer.email =
      email ?? customer.email;

    customer.phone =
      phone ?? customer.phone;

    customer.company =
      company ?? customer.company;

    customer.status =
      status ?? customer.status;

    if (
      req.user.role === "admin" &&
      assignedTo
    ) {
      customer.assignedTo = assignedTo;
    }

    await customer.save();

    // Clear admin cache
    await clearCustomerCache(
      req.user._id.toString(),
      req.user.role
    );

    const updatedCustomer =
      await Customer.findById(customer._id)
        .populate("assignedTo", "name email role")
        .populate("createdBy", "name email role");

    return res.status(200).json({
      success: true,
      message: "Customer updated successfully",
      customer: updatedCustomer,
    });

  } catch (error) {
    console.error(
      "Update Customer Error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =========================
// Delete Customer
// =========================

const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(
      req.params.id
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // Admin only
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admin can delete customers",
      });
    }

    await Customer.findByIdAndDelete(
      req.params.id
    );

    // Clear admin cache
    await clearCustomerCache(
      req.user._id.toString(),
      req.user.role
    );

    // Clear assigned sales cache
    if (customer.assignedTo) {
      await clearCustomerCache(
        customer.assignedTo.toString(),
        "sales"
      );
    }

    return res.status(200).json({
      success: true,
      message: "Customer deleted successfully",
    });

  } catch (error) {
    console.error(
      "Delete Customer Error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =========================
// Export
// =========================

module.exports = {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
};