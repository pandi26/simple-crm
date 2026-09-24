const mongoose = require("mongoose");

const leadActivitySchema = new mongoose.Schema(
  {
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      required: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    type: {
      type: String,
      enum: [
        "note",
        "call",
        "email",
        "meeting",
        "status_change",
        "assignment",
      ],
      default: "note",
    },

    description: {
      type: String,
      required: [true, "Activity description is required"],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "LeadActivity",
  leadActivitySchema
);