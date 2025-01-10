const asyncHandler = require("express-async-handler");
const Chat = require("../models/Chat");
const Message = require("../models/Message");

const accessChat = asyncHandler(async (req, res) => {
  const { userId } = req.body;

  let chat = await Chat.findOne({
    isGroupChat: false,
    $and: [
      { users: { $elemMatch: { $eq: req.user.id } } },
      { users: { $elemMatch: { $eq: userId } } },
    ],
  }).populate("users", "name email profilePicture");

  if (!chat) {
    chat = await Chat.create({
      chatName: "Direct Chat",
      isGroupChat: false,
      users: [req.user.id, userId],
    });
    chat = await Chat.findById(chat._id).populate("users", "name email profilePicture");
  }

  res.status(200).json(chat);
});

const fetchChats = asyncHandler(async (req, res) => {
  const chats = await Chat.find({
    users: { $elemMatch: { $eq: req.user.id } },
    deletedFor: { $ne: req.user.id }, // Exclude chats marked as deleted for the user
  })
    .populate("users", "name email profilePicture")
    .populate("latestMessage")
    .sort({ updatedAt: -1 });

  res.status(200).json(chats);
});

// Soft-delete a chat for a specific user
const deleteChat = asyncHandler(async (req, res) => {
  const { chatId } = req.params;

  try {
    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    // Ensure the user is part of the chat
    if (!chat.users.includes(req.user.id)) {
      return res.status(403).json({ message: "You are not authorized to delete this chat" });
    }

    // Mark the chat as deleted for the user
    if (!chat.deletedFor) {
      chat.deletedFor = [];
    }
    chat.deletedFor.push(req.user.id);

    await chat.save();

    res.status(200).json({ message: "Chat deleted for the user successfully" });
  } catch (error) {
    console.error("Error deleting chat:", error.message);
    res.status(500).json({ message: "Failed to delete chat" });
  }
});




module.exports = { accessChat, fetchChats, deleteChat };
