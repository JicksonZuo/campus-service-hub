const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const testRoutes = require("./routes/testRoutes");
const serviceRequestRoutes = require("./routes/serviceRequestRoutes");
const adminRequestRoutes = require("./routes/adminRequestRoutes");

const app = express();

// ===============================
// Configuration
// ===============================

const PORT = process.env.PORT || 5000;

// ===============================
// Database Connection
// ===============================

connectDB();

// ===============================
// Security Middleware
// ===============================

app.use(helmet());

app.use(
  cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:5177"
  ],
    credentials: true,
  })
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});

app.use("/api", limiter);

// ===============================
// General Middleware
// ===============================

app.use(morgan("dev"));

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

// ===============================
// API Routes
// ===============================

app.get("/api", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to Campus Service Hub API",
    version: "1.0.0",
  });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Campus Service Hub API is running",
    database: "MongoDB Atlas",
    timestamp: new Date().toISOString(),
  });
});

// Authentication routes
app.use("/api/auth", authRoutes);

// Service request routes
app.use("/api/requests", serviceRequestRoutes);
app.use("/api/admin/requests", adminRequestRoutes);

// Test routes
app.use("/api/test", testRoutes);

// ===============================
// 404 Handler
// ===============================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ===============================
// Global Error Handler
// ===============================

app.use((err, req, res, next) => {
  console.error("Server Error:", err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// ===============================
// Start Server
// ===============================

app.listen(PORT, () => {
  console.log("========================================");
  console.log("     CAMPUS SERVICE HUB API");
  console.log("========================================");
  console.log(`Server: http://localhost:${PORT}`);
  console.log(`Health: http://localhost:${PORT}/api/health`);
  console.log("========================================");
});