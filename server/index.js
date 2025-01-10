const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const cors = require("cors");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

let onlineUsers = {}; // Map userId to array of socket IDs

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "/uploads")));

// Routes
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/profile", require("./routes/profileRoutes"));
app.use("/api/requests", require("./routes/requestRoutes"));
app.use("/api/chats", require("./routes/chatRoutes"));
app.use("/api/messages", require("./routes/messageRoutes"));

// Socket.IO Logic
io.on("connection", (socket) => {
  console.log("New connection:", socket.id);

  // Handle user setup (when a user connects)
  socket.on("setup", (userId) => {
    if (!userId) {
      console.error("No userId provided in setup event.");
      return;
    }

    // Add or update the user with the current socket ID
    if (!onlineUsers[userId]) {
      onlineUsers[userId] = [];
    }
    onlineUsers[userId].push(socket.id);

    // Emit the updated online users list to all connected clients
    io.emit("online users", onlineUsers);
    console.log("Online Users after setup:", onlineUsers);
  });

  // Handle user joining a specific chat room
  socket.on("join chat", (chatId) => {
    if (!chatId) return;

    // Add the user to the chat room
    socket.join(chatId);
    console.log(`User joined chat: ${chatId}`);
  });

  // Handle new message broadcasting
  socket.on("new message", (newMessage) => {
    const chat = newMessage.chat;

    if (!chat || !chat.users) return;

    chat.users.forEach((user) => {
      if (user._id !== newMessage.sender._id && onlineUsers[user._id]) {
        onlineUsers[user._id].forEach((socketId) => {
          socket.to(socketId).emit("message received", newMessage);
        });
      }
    });

    // Broadcast the message to the room
    socket.to(chat._id).emit("message received", newMessage);
  });

  // Handle user disconnecting
  socket.on("disconnect", () => {
    let userIdToRemove = null;

    // Remove the socket ID from the onlineUsers map
    for (const userId in onlineUsers) {
      onlineUsers[userId] = onlineUsers[userId].filter((id) => id !== socket.id);
      if (onlineUsers[userId].length === 0) {
        userIdToRemove = userId;
      }
    }

    // Remove the user from onlineUsers if no sockets are left
    if (userIdToRemove) {
      delete onlineUsers[userIdToRemove];
    }

    // Emit the updated online users list to all connected clients
    io.emit("online users", onlineUsers);
    console.log("Online Users after disconnect:", onlineUsers);
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
