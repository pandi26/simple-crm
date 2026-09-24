const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const customerRoutes = require("./routes/customerRoutes");
const leadRoutes = require("./routes/leadRoutes");
const leadActivityRoutes = require("./routes/leadActivityRoutes");
const taskRoutes = require("./routes/taskRoutes");

const userRoutes = require("./routes/leadRoutes");

dotenv.config();

const app = express();

connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/customers", customerRoutes);

// Lead activity first
app.use("/api/leads", leadActivityRoutes);

app.use("/api/tasks", taskRoutes);

// Normal lead routes
app.use("/api/leads", leadRoutes);
app.use("/api/users", userRoutes);



// Test route
app.get("/", (req, res) => {
    res.json({
        message: "CRM backend is running successfully",
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});