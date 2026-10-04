const Customer = require("../models/customer");

const {
  getCache,
  setCache,
  deleteCache,
} = require("../utils/cache");

// =========================
// Constants
// =========================

const CUSTOMER_CACHE_KEY = "customers:all";
const CACHE_TTL = 60; // seconds

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
    } = req.body;

    // Validation
    if (!name || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: "Name, email and phone are required",
      });
    }

    // Create customer
    const customer = await Customer.create({
      name,
      email,
      phone,
      company,
      status,
      createdBy: req.user._id,
    });

    // Invalidate Redis cache
    await deleteCache(CUSTOMER_CACHE_KEY);

    return res.status(201).json({
      success: true,
      message: "Customer created successfully",
      customer,
    });
  } catch (error) {
    console.error("Create Customer Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create customer",
    });
  }
};

// =========================
// Get All Customers
// =========================

const getCustomers = async (req, res) => {
  try {
    // Check Redis cache
    const cachedCustomers = await getCache(
      CUSTOMER_CACHE_KEY
    );

    if (cachedCustomers) {
      console.log("Customers served from Redis");

      return res.status(200).json({
        success: true,
        count: cachedCustomers.length,
        customers: cachedCustomers,
        source: "redis",
      });
    }

    // Cache miss
    console.log("Customers served from MongoDB");

    const customers = await Customer.find()
      .sort({ createdAt: -1 })
      .lean();

    // Store customers in Redis
    await setCache(
      CUSTOMER_CACHE_KEY,
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
    console.error("Get Customers Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch customers",
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
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    return res.status(200).json({
      success: true,
      customer,
    });
  } catch (error) {
    console.error(
      "Get Customer By ID Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch customer",
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

    const {
      name,
      email,
      phone,
      company,
      status,
    } = req.body;

    // Update only provided fields
    customer.name = name ?? customer.name;
    customer.email = email ?? customer.email;
    customer.phone = phone ?? customer.phone;
    customer.company = company ?? customer.company;
    customer.status = status ?? customer.status;

    await customer.save();

    // Invalidate Redis cache
    await deleteCache(CUSTOMER_CACHE_KEY);

    return res.status(200).json({
      success: true,
      message: "Customer updated successfully",
      customer,
    });
  } catch (error) {
    console.error(
      "Update Customer Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to update customer",
    });
  }
};

// =========================
// Delete Customer
// =========================

const deleteCustomer = async (req, res) => {
  try {
    const customer =
      await Customer.findByIdAndDelete(
        req.params.id
      );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // Invalidate Redis cache
    await deleteCache(CUSTOMER_CACHE_KEY);

    return res.status(200).json({
      success: true,
      message: "Customer deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete Customer Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to delete customer",
    });
  }
};

// =========================
// Export Controllers
// =========================

module.exports = {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
};