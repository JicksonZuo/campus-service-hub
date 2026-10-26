const ServiceRequest = require("../models/ServiceRequest");

// ==========================================
// Create Service Request
// ==========================================

const createServiceRequest = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      priority,
    } = req.body;

    // Validate required fields
    if (!title || !description || !category) {
      return res.status(400).json({
        success: false,
        message: "Title, description, and category are required",
      });
    }

    // Create request
    const serviceRequest = await ServiceRequest.create({
      student: req.user.id,
      title,
      description,
      category,
      priority: priority || "Medium",
    });

    res.status(201).json({
      success: true,
      message: "Service request created successfully",
      request: serviceRequest,
    });
  } catch (error) {
    console.error("Create Service Request Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while creating service request",

    });
  }
};

// ==========================================
// Get Student's Service Requests
// ==========================================

const getMyServiceRequests = async (req, res) => {
  try {
    const requests = await ServiceRequest.find({
      student: req.user.id,
    })
      .populate("assignedTo", "fullName email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      requests,
    });
  } catch (error) {
    console.error("Get Service Requests Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while retrieving service requests",
    });
  }
};

// ==========================================
// Get Single Service Request
// ==========================================

const getServiceRequestById = async (req, res) => {
  try {
    const request = await ServiceRequest.findOne({
      _id: req.params.id,
      student: req.user.id,
    }).populate("assignedTo", "fullName email");

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Service request not found",
      });
    }

    res.status(200).json({
      success: true,
      request,
    });
  } catch (error) {
    console.error("Get Service Request Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while retrieving service request",
    });
  }
};

module.exports = {
  createServiceRequest,
  getMyServiceRequests,
  getServiceRequestById,
};


