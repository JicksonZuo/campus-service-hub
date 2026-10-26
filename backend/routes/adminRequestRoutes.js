const express = require("express");

const {
  getAllServiceRequests,
  assignServiceRequest,
  updateServiceRequestStatus,
  getAllStaff,
  createStaffMember,
} = require("../controllers/adminRequestController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

// ==========================================
// Admin/Staff Service Request Routes
// ==========================================

// Get all service requests
router.get(
  "/",
  protect,
  authorize("admin", "staff"),
  getAllServiceRequests
);

// Get all active staff members
router.post("/staff", protect, authorize("admin"), createStaffMember);

router.get(
  "/staff",
  protect,
  authorize("admin"),
  getAllStaff
);

// Assign a service request to staff
router.put(
  "/:id/assign",
  protect,
  authorize("admin"),
  assignServiceRequest
);

// Update service request status
router.put(
  "/:id/status",
  protect,
  authorize("admin", "staff"),
  updateServiceRequestStatus
);

module.exports = router;
