const express = require("express");

const {
  createServiceRequest,
  getMyServiceRequests,
  getServiceRequestById,
} = require("../controllers/serviceRequestController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Create a service request
router.post("/", protect, createServiceRequest);

// Get all requests belonging to logged-in student
router.get("/", protect, getMyServiceRequests);

// Get one request belonging to logged-in student
router.get("/:id", protect, getServiceRequestById);

module.exports = router;