const mongoose = require("mongoose");

const serviceRequestSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: {
      type: String,
      required: [true, "Request title is required"],
      trim: true,
      maxlength: 150,
    },

    description: {
      type: String,
      required: [true, "Request description is required"],
      trim: true,
      maxlength: 1000,
    },

    category: {
      type: String,
      enum: [
        "IT Support",
        "Hostel",
        "Academic",
        "Finance",
        "Library",
        "Transport",
        "Maintenance",
        "Hostel Maintenance",
        "Electrical",
        "Plumbing",
        "Cleaning",
        "Academic Support",
        "Security",
        "Other",
      ],
      required: true,
    },

    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Urgent"],
      default: "Medium",
    },

    status: {
      type: String,
      enum: [
        "Submitted",
        "Assigned",
        "In Progress",
        "Resolved",
        "Closed",
        "Rejected",
      ],
      default: "Submitted",
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    adminResponse: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1000,
    },

    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "ServiceRequest",
  serviceRequestSchema
);
