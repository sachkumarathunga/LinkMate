import React, { useEffect, useState } from "react";
import axios from "../api";
import { useNavigate } from "react-router-dom";
import "../styles/layouts/dashboardLayout.css";
import { io } from "socket.io-client";

const ENDPOINT = "http://localhost:5000";
let socket;

const Dashboard = () => {
  const [userData, setUserData] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [requestedUsers, setRequestedUsers] = useState([]); // List of requested users
  const [notifications, setNotifications] = useState({
    messages: 0,
    requests: 0,
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const profileRes = await axios.get("/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUserData(profileRes.data);

        const usersRes = await axios.get("/users/all", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAllUsers(usersRes.data);
        setFilteredUsers(usersRes.data.slice(0, 4)); // Show only 4 users initially

        // Fetch already requested users
        const requestsRes = await axios.get("/requests/sent", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setRequestedUsers(requestsRes.data.map((request) => request.receiverId));
      } catch (err) {
        console.error("Error fetching data:", err.response?.data?.message || err.message);
      }
    };

    fetchProfile();

    // Setup Socket.IO
    socket = io(ENDPOINT);
    socket.emit("setup", localStorage.getItem("userId"));

    // Listen for chat messages
    socket.on("new message", () => {
      setNotifications((prev) => ({ ...prev, messages: prev.messages + 1 }));
      playSound("chat");
    });

    // Listen for friend requests
    socket.on("new request", () => {
      setNotifications((prev) => ({ ...prev, requests: prev.requests + 1 }));
      playSound("request");
    });

    return () => socket.disconnect();
  }, []);

  const playSound = (type) => {
    const sound = new Audio(
      type === "chat"
        ? "/assets/sounds/chat-notification.mp3"
        : "/assets/sounds/request-notification.mp3"
    );

    sound.play().catch((error) => {
      console.error("Error playing sound:", error.message);
    });
  };

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.trim() === "") {
      setFilteredUsers(allUsers.slice(0, 4)); // Reset to first 4 users
    } else {
      const matchedUsers = allUsers.filter(
        (user) =>
          user.name.toLowerCase().includes(query.toLowerCase()) ||
          user.email.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredUsers(matchedUsers);
    }
  };

  const handleSendRequest = async (receiverId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "/requests/send",
        { receiverId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      alert(`Request sent to user!`);

      // Update the list of requested users
      setRequestedUsers((prev) => [...prev, receiverId]);
    } catch (err) {
      console.error("Error sending request:", err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    alert("You have been logged out.");
    navigate("/login");
  };

  if (!userData) {
    return <div className="dashboard-loading">Loading your dashboard...</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="sidebar">
        <h2>Menu</h2>
        <ul>
          <li className="active" onClick={() => navigate("/dashboard")}>
            Dashboard
          </li>
          <li onClick={() => navigate(`/chats/${userData._id}`)}>Chats</li> {/* Navigate to chat page */}
          <li onClick={() => navigate("/requests")}>Requests</li>
          <li>Settings</li>
        </ul>
        <button onClick={() => navigate("/profile")} className="sidebar-btn profile-update-btn">
          Update Profile
        </button>
        <button onClick={handleLogout} className="sidebar-btn logout-btn">
          Logout
        </button>
      </div>

      <div className="dashboard-main">
        <div className="dashboard-header">
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
              📩 {notifications.messages > 0 && <span className="badge">{notifications.messages}</span>}
            </div>
            <div className="notification-icon" title="Requests">
              🤝 {notifications.requests > 0 && <span className="badge">{notifications.requests}</span>}
            </div>
          </div>
        </div>

        <div className="dashboard-content">
          <div className="profile-card">
            <h2>Your Profile</h2>
            <p>
              <strong>Age:</strong> {userData.age || "N/A"}
            </p>
            <p>
              <strong>Gender:</strong> {userData.gender || "N/A"}
            </p>
            <p>
              <strong>Interests:</strong> {userData.interests.join(", ") || "N/A"}
            </p>
          </div>

          <div className="user-list">
            <h2>All Users</h2>
            <input
              type="text"
              placeholder="Search for users..."
              value={searchQuery}
              onChange={handleSearch}
              className="search-bar"
            />
            {filteredUsers.length > 0 ? (
              <ul>
                {filteredUsers.map((user) => (
                  <li key={user._id} className="user-list-item">
                    <div>
                      <span className="user-name">{user.name}</span>
                      <span className="user-email"> - {user.email}</span>
                    </div>
                    {/* Conditionally render the button */}
                    {requestedUsers.includes(user._id) ? (
                      <button className="requested-btn" disabled>
                        Requested
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSendRequest(user._id)}
                        className="send-request-btn"
                      >
                        Send Request
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No users found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
