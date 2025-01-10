import React from "react";
import "../styles/components/navbar.css";

const Navbar = ({ user }) => {
  return (
    <div className="navbar">
      <div className="navbar-left">
        <h1>Welcome, {user.name}</h1>
      </div>
      <div className="navbar-right">
        <span>Status: {user.status}</span>
        <button onClick={user.logout} className="logout-btn">
          Logout
        </button>
      </div>
    </div>
  );
};

export default Navbar;
