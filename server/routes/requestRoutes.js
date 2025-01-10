const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  sendRequest,
  getIncomingRequests,
  getOutgoingRequests,
  respondToRequest,
  getConnectedUsers,
} = require("../controllers/requestController");

const router = express.Router();

// Routes
router.post("/send", protect, sendRequest); // Send a connection request
router.get("/incoming", protect, getIncomingRequests); // Get incoming requests
router.get("/outgoing", protect, getOutgoingRequests); // Get outgoing requests
router.put("/", protect, respondToRequest); // Respond to a request (accept/reject)
router.get("/connected", protect, getConnectedUsers); // Get connected users

module.exports = router;
