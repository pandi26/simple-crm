const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const connectDB = require("./config/db");
const { connectRedis } = require("./config/redis");

const authRoutes = require("./routes/authRoutes");
const customerRoutes = require("./routes/customerRoutes");
const leadRoutes = require("./routes/leadRoutes");
const leadActivityRoutes = require("./routes/leadActivityRoutes");
const taskRoutes = require("./routes/taskRoutes");
const userRoutes = require("./routes/userRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

// =========================
// Middleware
// =========================

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());

// =========================
// Routes
// =========================

app.use("/api/auth", authRoutes);

app.use("/api/customers", customerRoutes);

app.use("/api/leads", leadRoutes);

app.use("/api/leads", leadActivityRoutes);

app.use("/api/tasks", taskRoutes);

app.use("/api/users", userRoutes);

app.use("/api/dashboard", dashboardRoutes);

// =========================
// Health Check
// =========================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "CRM backend is running successfully",
  });
});

// =========================
// Start Server
// =========================

const startServer = async () => {
  try {
    // MongoDB
    await connectDB();

    console.log("MongoDB connected successfully");

    // Redis
    await connectRedis();

    console.log("Redis connected successfully");

    // Express
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup error:", error);
    process.exit(1);
  }
};

startServer();