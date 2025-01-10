import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api";
import "../styles/components/requests.css";
import { io } from "socket.io-client";

const ENDPOINT = "http://localhost:5000"; // Backend server endpoint
let socket;

const Requests = () => {
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [notifications, setNotifications] = useState({
    messages: 0,
    requests: 0,
  });
  const [userData, setUserData] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState({});
  const navigate = useNavigate();

  // Fetch incoming requests, connected users, and user profile
  useEffect(() => {
    const fetchRequestsAndConnectedUsers = async () => {
      try {
        const token = localStorage.getItem("token");

        // Fetch user profile data
        const profileRes = await axios.get("/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUserData(profileRes.data);

        // Fetch incoming requests
        const incomingRes = await axios.get("/requests/incoming", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setIncomingRequests(incomingRes.data);

        // Fetch connected users
        const connectedRes = await axios.get("/requests/connected", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setConnectedUsers(connectedRes.data);
      } catch (err) {
        console.error("Error fetching requests or users:", err.message);
      }
    };

    fetchRequestsAndConnectedUsers();

    // Setup Socket.IO for real-time events
    const userId = localStorage.getItem("userId");
    if (!userId) {
      console.error("No userId found in localStorage.");
      return;
    }

    // Initialize Socket.IO connection
    socket = io(ENDPOINT);
    socket.emit("setup", userId);

    // Listen for online users updates
    socket.on("online users", (users) => {
      setOnlineUsers(users);
    });

    // Listen for new messages
    socket.on("new message", () => {
      setNotifications((prev) => ({ ...prev, messages: prev.messages + 1 }));
    });

    // Listen for new connection requests
    socket.on("new request", () => {
      setNotifications((prev) => ({ ...prev, requests: prev.requests + 1 }));
    });

    // Cleanup on component unmount
    return () => socket.disconnect();
  }, []);

  // Handle request actions (accept/reject)
  const handleRequestAction = async (requestId, action) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        "/requests",
        { requestId, action },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Remove the handled request from the list
      setIncomingRequests((prev) =>
        prev.filter((request) => request._id !== requestId)
      );
    } catch (err) {
      console.error("Error updating request:", err.message);
    }
  };

  // Handle user logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    alert("You have been logged out.");
    navigate("/login");
  };

  if (!userData) {
    return <div className="requests-loading">Loading your requests...</div>;
  }

  return (
    <div className="requests-container">
      {/* Sidebar */}
      <div className="sidebar">
        <h2>Menu</h2>
        <ul>
          <li onClick={() => navigate("/dashboard")}>Dashboard</li>
          <li className="active" onClick={() => navigate("/requests")}>
            Requests
          </li>
          <li>Settings</li>
        </ul>
        <button
          onClick={() => navigate("/profile")}
          className="sidebar-btn profile-update-btn"
        >
          Update Profile
        </button>
        <button onClick={handleLogout} className="sidebar-btn logout-btn">
          Logout
        </button>
      </div>

      {/* Main Content */}
      <div className="requests-main">
        <div className="requests-header">
          <div className="platform-name">
            <h1>LinkMate</h1>
          </div>
          <div className="header-right">
            <img
              src={`http://localhost:5000${userData.profilePicture}`}
              alt="Profile"
              className="profile-picture"
            />
            <span className="user-greeting">Hi, {userData.fullName}</span>
          </div>
          <div className="notification-container">
            <div className="notification-icon" title="Messages">
              📩{" "}
              {notifications.messages > 0 && (
                <span className="badge">{notifications.messages}</span>
              )}
            </div>
            <div className="notification-icon" title="Requests">
              🤝{" "}
              {notifications.requests > 0 && (
                <span className="badge">{notifications.requests}</span>
              )}
            </div>
          </div>
        </div>

        <div className="requests-content">
          <div className="requests-section">
            <h2>Incoming Requests</h2>
            <div className="requests-list">
              {incomingRequests.length > 0 ? (
                incomingRequests.map((req) => (
                  <div key={req._id} className="request-card">
                    <p>
                      <strong>{req.sender.name}</strong> ({req.sender.email})
                      wants to connect with you.
                    </p>
                    <div>
                      <button
                        className="accept-btn"
                        onClick={() => handleRequestAction(req._id, "accept")}
                      >
                        Accept
                      </button>
                      <button
                        className="reject-btn"
                        onClick={() => handleRequestAction(req._id, "reject")}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p>No incoming requests</p>
              )}
            </div>
          </div>

          <div className="requests-section">
            <h2>Connected Users</h2>
            <div className="connected-users-list">
              {connectedUsers.length > 0 ? (
                connectedUsers.map((user) => (
                  <div key={user._id} className="connected-user-card">
                    <p>
                      <strong>{user.name}</strong> ({user.email})
                    </p>
                    <div className="user-actions">
                      <button
                        className="chat-btn"
                        onClick={async () => {
                          try {
                            const token = localStorage.getItem("token");
                            const res = await axios.post(
                              "/chats",
                              { userId: user._id },
                              { headers: { Authorization: `Bearer ${token}` } }
                            );
                            navigate(`/chats/${res.data._id}`);
                          } catch (err) {
                            console.error("Error starting chat:", err.message);
                          }
                        }}
                      >
                        Chat
                      </button>
                      <button
                        className={`status-btn ${
                          onlineUsers[user._id]?.length > 0
                            ? "status-online"
                            : "status-offline"
                        }`}
                      >
                        {onlineUsers[user._id]?.length > 0 ? "Online" : "Offline"}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p>No connected users found</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Requests;
