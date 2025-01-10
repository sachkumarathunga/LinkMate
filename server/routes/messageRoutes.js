const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { sendMessage, getMessages, deleteMessage, deleteMessagesByChat } = require("../controllers/messageController");

const router = express.Router();
const multer = require("multer");

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

router.post("/", protect, upload.single("image"), sendMessage); // Send a message
router.get("/:chatId", protect, getMessages); // Get messages for a chat
router.delete("/:messageId", protect, deleteMessage); // Delete a single message
router.delete("/chat/:chatId", protect, deleteMessagesByChat); // Delete all messages for a chat

module.exports = router;


