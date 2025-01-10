import React from "react";
import "../styles/components/sidebar.css";

const Sidebar = ({ menuItems, activeItem, setActiveItem }) => {
  return (
    <div className="sidebar">
      <h2>Menu</h2>
      <ul>
        {menuItems.map((item) => (
          <li
            key={item}
            className={activeItem === item.toLowerCase() ? "active" : ""}
            onClick={() => setActiveItem(item.toLowerCase())}
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
