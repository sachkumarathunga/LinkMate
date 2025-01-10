const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const Request = require("../models/Request");

// Send a connection request
const sendRequest = asyncHandler(async (req, res) => {
  const { receiverId } = req.body;
  const senderId = req.user.id;

  if (receiverId === senderId) {
    return res.status(400).json({ message: "You cannot send a request to yourself" });
  }

  const existingRequest = await Request.findOne({
    sender: senderId,
    receiver: receiverId,
  });

  if (existingRequest) {
    return res.status(400).json({ message: "Request already sent" });
  }

  await Request.create({ sender: senderId, receiver: receiverId });
  res.status(200).json({ message: "Request sent successfully" });
});

// Get incoming requests
const getIncomingRequests = asyncHandler(async (req, res) => {
  const incomingRequests = await Request.find({ receiver: req.user.id, status: "pending" })
    .populate("sender", "name email")
    .exec();

  res.status(200).json(incomingRequests);
});

// Get outgoing requests
const getOutgoingRequests = asyncHandler(async (req, res) => {
  const outgoingRequests = await Request.find({ sender: req.user.id, status: "pending" })
    .populate("receiver", "name email")
    .exec();

  res.status(200).json(outgoingRequests);
});

// Respond to a request (accept/reject)
const respondToRequest = asyncHandler(async (req, res) => {
  const { requestId, action } = req.body;

  const request = await Request.findById(requestId);
  if (!request) {
    return res.status(404).json({ message: "Request not found" });
  }

  if (request.receiver.toString() !== req.user.id) {
    return res.status(403).json({ message: "You are not authorized to respond to this request" });
  }

  request.status = action === "accept" ? "accepted" : "rejected";

  if (action === "accept") {
    const sender = await User.findById(request.sender);
    const receiver = await User.findById(request.receiver);

    sender.connectedUsers.push(receiver.id);
    receiver.connectedUsers.push(sender.id);

    await sender.save();
    await receiver.save();
  }

  await request.save();
  res.status(200).json({ message: `Request ${action}ed successfully` });
});

// Get connected users
const getConnectedUsers = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).populate("connectedUsers", "name email");
  res.status(200).json(user.connectedUsers);
});

module.exports = {
  sendRequest,
  getIncomingRequests,
  getOutgoingRequests,
  respondToRequest,
  getConnectedUsers,
};
