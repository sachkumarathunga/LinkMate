const asyncHandler = require("express-async-handler");
const Message = require("../models/Message");
const Chat = require("../models/Chat");
const multer = require("multer");

// Set up multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage }).single("image");

// Send a message (text or image)
const sendMessage = asyncHandler(async (req, res) => {
  const { content, chatId } = req.body;

  if (!chatId) {
    return res.status(400).json({ message: "Chat ID is required" });
  }

  try {
    const messageData = {
      sender: req.user.id,
      chat: chatId,
    };

    // Handle text and image messages
    if (req.file) {
      messageData.type = "image";
      messageData.image = `/uploads/${req.file.filename}`;
    } else if (content) {
      messageData.type = "text";
      messageData.content = content;
    } else {
      return res.status(400).json({ message: "Message content or image is required" });
    }

    const message = await Message.create(messageData);

    await message.populate("sender", "name email profilePicture");
    await message.populate("chat");
    await message.populate({
      path: "chat.users",
      select: "name email profilePicture",
    });

    await Chat.findByIdAndUpdate(chatId, { latestMessage: message });

    res.status(200).json(message);
  } catch (error) {
    console.error("Error sending message:", error.message);
    res.status(500).json({ message: "Failed to send message" });
  }
});

// Get messages for a specific chat
const getMessages = asyncHandler(async (req, res) => {
  const { chatId } = req.params;

  try {
    const messages = await Message.find({ chat: chatId })
      .populate("sender", "name email profilePicture")
      .populate("chat");

    res.status(200).json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error.message);
    res.status(500).json({ message: "Failed to fetch messages" });
  }
});

// Delete a specific message
const deleteMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;

  try {
    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Verify if the user is the sender of the message
    if (message.sender.toString() !== req.user.id) {
      return res.status(403).json({ message: "You are not authorized to delete this message" });
    }

    await message.deleteOne();
    res.status(200).json({ message: "Message deleted successfully" });
  } catch (error) {
    console.error("Error deleting message:", error.message);
    res.status(500).json({ message: "Failed to delete message" });
  }
});




const deleteMessagesByChat = asyncHandler(async (req, res) => {
  const { chatId } = req.params;

  try {
    await Message.deleteMany({ chat: chatId });
    res.status(200).json({ message: "All messages deleted successfully" });
  } catch (error) {
    console.error("Error deleting messages:", error.message);
    res.status(500).json({ message: "Failed to delete messages" });
  }
});


module.exports = { sendMessage, getMessages, deleteMessage, upload,deleteMessagesByChat };
