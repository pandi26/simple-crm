const User = require("../models/User");
const bcrypt = require("bcryptjs");

// =========================
// Get All Users
// =========================

const getUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Get Users Error:", error.message);

    return res.status(500).json({
      message: error.message,
    });
  }
};

// =========================
// Get Single User
// =========================

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      user,
    });
  } catch (error) {
    console.error(
      "Get User By ID Error:",
      error.message
    );

    return res.status(500).json({
      message: error.message,
    });
  }
};

// =========================
// Create User
// =========================

const createUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message:
          "Name, email and password are required",
      });
    }

    const existingUser = await User.findOne({
      email: email.toLowerCase(),
    });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role || "user",
    });

    return res.status(201).json({
      message: "User created successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(
      "Create User Error:",
      error.message
    );

    return res.status(500).json({
      message: error.message,
    });
  }
};

// =========================
// Update User
// =========================

const updateUser = async (req, res) => {
  try {
    const user = await User.findById(
      req.params.id
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const {
      name,
      email,
      password,
      role,
    } = req.body;

    if (name !== undefined) {
      user.name = name;
    }

    if (email !== undefined) {
      user.email = email.toLowerCase();
    }

    if (role !== undefined) {
      user.role = role;
    }

    if (password) {
      user.password = await bcrypt.hash(
        password,
        10
      );
    }

    await user.save();

    return res.status(200).json({
      message: "User updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(
      "Update User Error:",
      error.message
    );

    return res.status(500).json({
      message: error.message,
    });
  }
};

// =========================
// Delete User
// =========================

const deleteUser = async (req, res) => {
  try {
    // Prevent admin from deleting themselves
    if (String(req.user._id) === String(req.params.id)) {
      return res.status(400).json({
        message: "You cannot delete your own account",
      });
    }

    const user = await User.findByIdAndDelete(
      req.params.id
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete User Error:",
      error.message
    );

    return res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};