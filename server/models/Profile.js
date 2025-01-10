const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  fullName: {
    type: String,
    required: true,
  },
  age: {
    type: Number,
    default: null,
  },
  gender: {
    type: String,
    enum: ["Male", "Female", "Other"],
    default: null,
  },
  interests: {
    type: [String],
    default: [],
  },
  profilePicture: {
    type: String,
    default: "",
  },
  phoneNumber: {
    type: String,
    default: null,
  },
  
});

module.exports = mongoose.model("Profile", profileSchema);
