
const mongoose = require("mongoose");
const ServiceRequest = require("../models/ServiceRequest");
const User = require("../models/User");

const STAFF_FIELDS = "fullName email studentId role department specializations";
const STUDENT_FIELDS = "fullName email studentId";
const ASSIGNED_FIELDS = "fullName email studentId role department specializations";

const populateRequest = (query) =>
  query
    .populate("student", STUDENT_FIELDS)
    .populate("assignedTo", ASSIGNED_FIELDS);

const getAllServiceRequests = async (req, res) => {
  try {
    const requests = await populateRequest(
      ServiceRequest.find()
    ).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: requests.length,
      requests,
    });
  } catch (error) {
    console.error("Get All Service Requests Error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to retrieve service requests.",
    });
  }
};

const assignServiceRequest = async (req, res) => {
  try {
    const { staffId } = req.body;
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid service request ID.",
      });
    }

    if (!staffId || !mongoose.isValidObjectId(staffId)) {
      return res.status(400).json({
        success: false,
        message: "Please select a valid staff member.",
      });
    }

    const staff = await User.findOne({
      _id: staffId,
      role: "staff",
      isActive: true,
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Active staff member not found.",
      });
    }

    const request = await ServiceRequest.findById(id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Service request not found.",
      });
    }

    request.assignedTo = staff._id;

    // Only move new requests to Assigned.
    // Preserve later statuses when reassigning.
    if (request.status === "Submitted") {
      request.status = "Assigned";
    }

    await request.save();

    const updatedRequest = await populateRequest(
      ServiceRequest.findById(request._id)
    );

    console.log("Service request assigned:", {
      requestId: String(request._id),
      staffId: String(staff._id),
      status: updatedRequest.status,
    });

    return res.status(200).json({
      success: true,
      message: `Request assigned to ${staff.fullName}.`,
      request: updatedRequest,
    });
  } catch (error) {
    console.error("Assign Service Request Error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to assign the service request.",
    });
  }
};

const updateServiceRequestStatus = async (req, res) => {
  try {
    const { status, adminResponse } = req.body;
    const { id } = req.params;

    const allowedStatuses = [
      "Submitted",
      "Assigned",
      "In Progress",
      "Resolved",
      "Closed",
      "Rejected",
    ];

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid service request ID.",
      });
    }

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Please select a valid service request status.",
      });
    }

    if (
      adminResponse !== undefined &&
      (typeof adminResponse !== "string" ||
        adminResponse.length > 1000)
    ) {
      return res.status(400).json({
        success: false,
        message: "The response must be text no longer than 1000 characters.",
      });
    }

    const request = await ServiceRequest.findById(id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Service request not found.",
      });
    }

    request.status = status;

    if (adminResponse !== undefined) {
      request.adminResponse = adminResponse.trim();
    }

    // Keep the resolution timestamp consistent with the current status.
    request.resolvedAt =
      status === "Resolved" ? new Date() : null;

    await request.save();

    const updatedRequest = await populateRequest(
      ServiceRequest.findById(request._id)
    );

    console.log("Service request status updated:", {
      requestId: String(request._id),
      status: updatedRequest.status,
      resolvedAt: updatedRequest.resolvedAt,
    });

    return res.status(200).json({
      success: true,
      message: `Request "${updatedRequest.title}" was updated successfully.`,
      request: updatedRequest,
    });
  } catch (error) {
    console.error("Update Service Request Error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to update the service request.",
    });
  }
};

const getAllStaff = async (req, res) => {
  try {
    const staff = await User.find({
      role: "staff",
      isActive: true,
    })
      .select(STAFF_FIELDS)
      .sort({ fullName: 1 });

    return res.status(200).json({
      success: true,
      count: staff.length,
      staff,
    });
  } catch (error) {
    console.error("Get Staff Error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to retrieve staff members.",
    });
  }
};


const createStaffMember = async (req, res) => {
  try {
    const { fullName, email, password, department, specializations = [] } = req.body || {};
    if (!fullName || !email || !password || !department) {
      return res.status(400).json({ success: false, message: "Full name, email, password, and department are required." });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters." });
    }
    if (!Array.isArray(specializations)) {
      return res.status(400).json({ success: false, message: "Specializations must be a list." });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ success: false, message: "An account with this email already exists." });
    }

    const bcrypt = require("bcryptjs");
    const hashedPassword = await bcrypt.hash(String(password), 12);
    const staff = await User.create({
      fullName: String(fullName).trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: "staff",
      department: String(department).trim(),
      specializations: specializations.map((item) => String(item).trim()).filter(Boolean),
      isActive: true,
    });

    return res.status(201).json({
      success: true,
      message: "Staff account created successfully.",
      staff: {
        _id: staff._id,
        fullName: staff.fullName,
        email: staff.email,
        role: staff.role,
        department: staff.department,
        specializations: staff.specializations,
        isActive: staff.isActive,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: "An account with this email already exists." });
    }
    console.error("Create Staff Error:", error);
    return res.status(500).json({ success: false, message: "Unable to create staff account." });
  }
};
module.exports = {
  getAllServiceRequests,
  assignServiceRequest,
  updateServiceRequestStatus,
  getAllStaff,
  createStaffMember,
};

