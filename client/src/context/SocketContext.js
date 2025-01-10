import React, { createContext, useContext, useEffect, useRef } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext();
const ENDPOINT = "http://localhost:5000";

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const socket = useRef(null);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      console.error("No userId found in localStorage.");
      return;
    }

    // Initialize Socket.IO
    socket.current = io(ENDPOINT);
    socket.current.emit("setup", userId);

    // Cleanup socket connection on unmount
    return () => {
      socket.current.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={socket.current}>
      {children}
    </SocketContext.Provider>
  );
};
