const asyncHandler = require("express-async-handler");
const Profile = require("../models/Profile");
const multer = require("multer");
const path = require("path");

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Save files to the "uploads" folder
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // Generate unique filenames
  },
});
const upload = multer({ storage });

// Update or create user profile
const updateUserProfile = asyncHandler(async (req, res) => {
  const { fullName, age, gender, interests, phoneNumber } = req.body;

  if (!fullName) {
    return res.status(400).json({ message: "Full name is required." });
  }

  const profileData = {
    user: req.user.id,
    fullName,
    age,
    gender,
    interests: Array.isArray(interests) ? interests : [],
    profilePicture: req.body.profilePicture || "", // Handle profile picture
    phoneNumber: phoneNumber || null,
  };

  let profile = await Profile.findOne({ user: req.user.id });

  if (profile) {
    // Update existing profile
    profile = await Profile.findOneAndUpdate({ user: req.user.id }, profileData, {
      new: true,
    });
  } else {
    // Create a new profile
    profile = await Profile.create(profileData);
  }

  res.status(200).json(profile);
});

// Get user profile
const getUserProfile = asyncHandler(async (req, res) => {
  const profile = await Profile.findOne({ user: req.user.id });

  if (!profile) {
    return res.status(200).json({
      user: req.user.id,
      fullName: "",
      age: null,
      gender: "",
      interests: [],
      profilePicture: "",
      phoneNumber: null,
    });
  }

  res.status(200).json(profile);
});

// Upload profile picture
const uploadProfilePicture = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded." });
  }

  const profile = await Profile.findOne({ user: req.user.id });
  if (!profile) {
    return res.status(404).json({ message: "Profile not found." });
  }

  profile.profilePicture = `/uploads/${req.file.filename}`;
  await profile.save();

  res.status(200).json({ profilePicture: profile.profilePicture });
});

module.exports = {
  updateUserProfile,
  getUserProfile,
  uploadProfilePicture,
  upload,
};
