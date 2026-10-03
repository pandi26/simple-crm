const Customer = require("../models/customer");
const { redisClient } = require("../config/redis");

const CUSTOMER_CACHE_KEY = "customers:all";
const CACHE_TTL = 60; // 60 seconds

// Create Customer
const createCustomer = async (req, res) => {
  try {
    const { name, email, phone, company, status } = req.body;

    if (!name || !email || !phone) {
      return res.status(400).json({
        message: "name, email, phone are required",
      });
    }

    const customer = await Customer.create({
      name,
      email,
      phone,
      company,
      status,
      createdBy: req.user._id,
    });

    // Clear customers cache
    await redisClient.del(CUSTOMER_CACHE_KEY);

    return res.status(201).json({
      message: "Customer created successfully",
      customer,
    });
  } catch (error) {
    console.error("Create Customer Error:", error.message);

    return res.status(500).json({
      message: error.message,
    });
  }
};

// Get All Customers
const getCustomers = async (req, res) => {
  try {
    // Check Redis
    const cachedCustomers = await redisClient.get(CUSTOMER_CACHE_KEY);

    if (cachedCustomers) {
      console.log("Customers Cache HIT");

      const customers = JSON.parse(cachedCustomers);

      return res.status(200).json({
        count: customers.length,
        customers,
        source: "redis",
      });
    }

    console.log("Customers Cache MISS");

    // Get from MongoDB
    const customers = await Customer.find();

    // Store in Redis
    await redisClient.setEx(
      CUSTOMER_CACHE_KEY,
      CACHE_TTL,
      JSON.stringify(customers)
    );

    return res.status(200).json({
      count: customers.length,
      customers,
      source: "mongodb",
    });
  } catch (error) {
    console.error("Get Customers Error:", error.message);

    return res.status(500).json({
      message: error.message,
    });
  }
};

// Get Customer By ID
const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    return res.status(200).json({
      customer,
    });
  } catch (error) {
    console.error("Get Customer Error:", error.message);

    return res.status(500).json({
      message: error.message,
    });
  }
};

// Update Customer
const updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
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

    customer.name = name ?? customer.name;
    customer.email = email ?? customer.email;
    customer.phone = phone ?? customer.phone;
    customer.company = company ?? customer.company;
    customer.status = status ?? customer.status;

    await customer.save();

    // Clear customers cache
    await redisClient.del(CUSTOMER_CACHE_KEY);

    return res.status(200).json({
      message: "Customer updated successfully",
      customer,
    });
  } catch (error) {
    console.error("Update Customer Error:", error.message);

    return res.status(500).json({
      message: error.message,
    });
  }
};

// Delete Customer
const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(
      req.params.id
    );

    if (!customer) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    // Clear customers cache
    await redisClient.del(CUSTOMER_CACHE_KEY);

    return res.status(200).json({
      message: "Customer deleted successfully",
    });
  } catch (error) {
    console.error("Delete Customer Error:", error.message);

    return res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
};