const mongoose = require("mongoose");

const userSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    requests: [
      {
        sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        status: { type: String, enum: ["Pending", "Accepted", "Rejected"], default: "Pending" },
      },
    ],
    connectedUsers: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
