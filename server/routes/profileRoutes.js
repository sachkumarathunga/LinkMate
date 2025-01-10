const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { updateUserProfile, getUserProfile, upload, uploadProfilePicture } = require("../controllers/profileController");

const router = express.Router();

// Upload profile picture
router.post("/upload", protect, upload.single("profilePicture"), uploadProfilePicture);

// Update user profile
router.put("/", protect, updateUserProfile);

// Get user profile
router.get("/", protect, getUserProfile);

module.exports = router;
