import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import RegisterLogin from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Chats from "./pages/Chats";
import Requests from "./pages/Requests";

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/" />;
};

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [profileCompleted, setProfileCompleted] = useState(
    localStorage.getItem("profileCompleted") === "true"
  );

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token); // Check if a token exists
  }, []);

  return (
    <Router>
      <Routes>
        {/* Registration/Login Page */}
        <Route path="/" element={<RegisterLogin />} />

        {/* Profile Page */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile setProfileCompleted={setProfileCompleted} />
            </ProtectedRoute>
          }
        />

        {/* Dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              {profileCompleted ? <Dashboard /> : <Navigate to="/profile" />}
            </ProtectedRoute>
          }
        />

        {/* Chats */}
        <Route
          path="/chats/:chatId"
          element={
            <ProtectedRoute>
              <Chats />
            </ProtectedRoute>
          }
        />

        {/* Requests */}
        <Route
          path="/requests"
          element={
            <ProtectedRoute>
              <Requests />
            </ProtectedRoute>
          }
        />

        {/* Default Redirection */}
        <Route
          path="*"
          element={
            <Navigate
              to={
                isAuthenticated
                  ? profileCompleted
                    ? "/dashboard"
                    : "/profile"
                  : "/"
              }
            />
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
