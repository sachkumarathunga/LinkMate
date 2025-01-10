const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { accessChat, fetchChats, deleteChat,createGroupChat,
    addToGroup,
    removeFromGroup, } = require("../controllers/chatController");

const router = express.Router();

router.post("/", protect, accessChat); // Access or create a chat
router.get("/", protect, fetchChats); // Fetch all chats
router.delete("/:chatId", protect, deleteChat); // Delete a chat



module.exports = router;
