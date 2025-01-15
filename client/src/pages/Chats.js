import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "../api";
import { io } from "socket.io-client";
import "../styles/components/chat.css";

const ENDPOINT = "http://localhost:5000";
let socket;
let typingTimeout;

const Chats = () => {
  const { chatId } = useParams();
  const [chatList, setChatList] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [image, setImage] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [showDropdownChat, setShowDropdownChat] = useState(null);
  const [showDropdownMessage, setShowDropdownMessage] = useState(null);
  const [typing, setTyping] = useState(false);
  const [lastSeen, setLastSeen] = useState({});
  const [typingStatus, setTypingStatus] = useState(null);
  const navigate = useNavigate();
  let userId = localStorage.getItem("userId");

  // Ensure userId is fetched correctly and navigate to login if not present
  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (!storedUserId) {
      console.error("No userId found in localStorage");
      navigate("/login");
    } else {
      userId = storedUserId;
    }
  }, [navigate]);

  // Initialize Socket.IO and setup online/offline status
  useEffect(() => {
    socket = io(ENDPOINT);

    // Emit setup event with the userId
    socket.emit("setup", userId);

    // Handle online/offline updates
    socket.on("user online", (id) => {
      console.log("id:", id);
      setOnlineUsers(id);
    });

    // Listen for typing status
    socket.on("typing", (data) => {
      if (data.chatId === chatId && data.userId !== userId) {
        setTypingStatus(data.name);
      }
    });

    socket.on("stop typing", (data) => {
      if (data.chatId === chatId) {
        setTypingStatus(null);
      }
    });

    return () => {
      socket.emit("user offline", userId);
      socket.disconnect();
    };
  }, [userId, chatId]);

  // Fetch chats and profile data
  useEffect(() => {
    const fetchChatsAndProfile = async () => {
      const token = localStorage.getItem("token");
      try {
        const chatsRes = await axios.get("/chats", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setChatList(chatsRes.data);

        const profileRes = await axios.get("/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfileData(profileRes.data);
      } catch (err) {
        console.error("Error fetching data:", err.message);
      }
    };

    fetchChatsAndProfile();
  }, []);

  // Fetch messages when chatId changes
  useEffect(() => {
    const fetchMessages = async () => {
      const token = localStorage.getItem("token");
      try {
        if (chatList[0]?._id) {
          const res = await axios.get(`/messages/${chatList[0]?._id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setMessages(res.data);
        }
      } catch (err) {
        console.error("Error fetching messages:", err.message);
      }
    };

    if (chatId) {
      if (messages) {
        fetchMessages();
      }
      socket?.emit("join chat", chatId);
      socket?.on("message received", (newMessage) => {
        setMessages((prev) => [...prev, newMessage]);
      });
    }

    return () => {
      if (socket) socket.off("message received");
    };
  }, [chatId, messages, chatList]);

  // Send a new message
  const sendMessage = async () => {
    if (!newMessage.trim() && !image) return;

    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("chatId", chatId);
    if (newMessage.trim()) formData.append("content", newMessage);
    if (image) formData.append("image", image);

    try {
      const res = await axios.post("/messages", formData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });

      socket?.emit("new message", res.data);
      socket?.emit("stop typing", { chatId, userId });
      setMessages((prev) => [...prev, res.data]);
      setNewMessage("");
      setImage(null);
    } catch (err) {
      console.error("Error sending message:", err.message);
    }
  };

  // Typing status handling
  const handleTyping = () => {
    setTyping(true);
    socket.emit("typing", { chatId, userId, name: profileData?.fullName });

    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      setTyping(false);
      socket.emit("stop typing", { chatId, userId });
    }, 2000);
  };

  // Delete a chat
  const deleteChat = async (chatId) => {
    if (window.confirm("Are you sure you want to delete this chat?")) {
      const token = localStorage.getItem("token");
      try {
        await axios.delete(`/chats/${chatId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setChatList((prev) => prev.filter((chat) => chat._id !== chatId));
        if (chatId === chatId) {
          navigate("/dashboard");
        }
      } catch (err) {
        console.error("Error deleting chat:", err.message);
      }
    }
  };

  // Delete a message
  const deleteMessage = async (messageId) => {
    if (window.confirm("Are you sure you want to delete this message?")) {
      const token = localStorage.getItem("token");
      try {
        await axios.delete(`/messages/chat/${chatId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMessages((prev) => prev.filter((message) => message._id !== messageId));
      } catch (err) {
        console.error("Error deleting message:", err.message);
      }
    }
  };

  return (
    <div className="chat-page-container">
      <div className="sidebar-container">
        <div className="sidebar-header">
          {profileData && (
            <div className="my-profile">
              <img
                src={`http://localhost:5000${profileData.profilePicture}`}
                alt="My Profile"
                className="profile-picture"
              />
              <div>
                <p className="greeting">Welcome, {profileData.fullName}</p>
                <p className="professional-title">{profileData.professionalTitle || "Professional"}</p>
              </div>
            </div>
          )}
        </div>

        <div className="chat-list-header">
          <span>Chat List</span>
        </div>

        <div className="chat-list">
          {chatList.map((chat) => {
            const connectedUser = chat.users.find((user) => user._id !== userId);
            return (
              <div
                key={chat._id}
                className={`chat-list-item ${chatId === chat._id ? "active-chat" : ""}`}
                onClick={() => navigate(`/chats/${chat._id}`)}
                onMouseEnter={() => setShowDropdownChat(chat._id)}
                onMouseLeave={() => setShowDropdownChat(null)}
              >
                <div className="chat-item-avatar">
                  <img
                    src={`https://ui-avatars.com/api/?name=${chat.users
                      .filter((user) => user._id !== userId)
                      .map((user) => user.name)
                      .join(", ")}`}
                    alt="Avatar"
                  />
                </div>
                <div>
                  <p className="chat-item-name">
                    {chat.users
                      .filter((user) => user._id !== userId)
                      .map((user) => user.name)
                      .join(", ")}
                  </p>
                  <p
                    className={`status ${onlineUsers.includes(connectedUser?._id) ? "online" : "offline"
                      }`}
                  >
                    {onlineUsers.includes(connectedUser?._id)
                      ? "Online"
                      : `Last seen: ${lastSeen[connectedUser?._id] || "Unknown"}`}
                  </p>
                  {showDropdownChat === chat._id && (
                    <div className="dropdown">
                      <button onClick={() => deleteChat(chat._id)}>Delete</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="chat-window">
        <div className="chat-header">
          <div className="chat-header-buttons">
            <button onClick={() => navigate("/dashboard")} className="back-dashboard-btn">
              Back to Dashboard
            </button>
            <button onClick={() => navigate("/requests")} className="back-requests-btn">
              Back to Requests
            </button>
          </div>
          <h3>LinkMate</h3>
        </div>
        <div className="chat-messages">
          {messages.map((msg) => (
            <div
              key={msg._id}
              className={`chat-bubble ${msg.sender._id === userId ? "sent" : "received"}`}
              onMouseEnter={() => setShowDropdownMessage(msg._id)}
              onMouseLeave={() => setShowDropdownMessage(null)}
            >
              <div className="chat-bubble-wrapper">
                {msg.type === "image" ? (
                  <img
                    src={`http://localhost:5000${msg.image}`}
                    alt="Chat"
                    className="chat-image"
                  />
                ) : (
                  <div className="chat-bubble-content">
                    <strong>{msg.sender._id === userId ? "You" : msg.sender.name}:</strong>{" "}
                    {msg.content}
                  </div>
                )}
                {showDropdownMessage === msg._id && (
                  <div className="dropdown">
                    <button onClick={() => deleteMessage(msg._id)}>Delete</button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {typingStatus && <div className="typing-status">{typingStatus} is typing...</div>}
        </div>
        <div className="message-input-container">
          <input
            type="text"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
          />
          <input type="file" onChange={(e) => setImage(e.target.files[0])} />
          <button onClick={sendMessage}>Send</button>
        </div>
      </div>
    </div>
  );
};

export default Chats;
