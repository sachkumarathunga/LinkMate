import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/components/register.css";

const RegisterLogin = () => {
  const [isRegister, setIsRegister] = useState(true);
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/dashboard");
    }
  }, [navigate]);

  const toggleForm = () => {
    setIsRegister(!isRegister);
    setFormData({ name: "", email: "", password: "" });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isRegister) {
        const res = await axios.post("http://localhost:5000/api/users/register", formData);
        alert("Registration successful!");
        console.log("Registration successful:", res.data);

        // Store token and userId in localStorage
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("userId", res.data.id);

        setIsRegister(false);
      } else {
        const res = await axios.post("http://localhost:5000/api/users/login", formData);
        alert("Login successful!");
        console.log("Login successful:", res.data);

        // Store token and userId in localStorage
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("userId", res.data.id);

        const profileCompleted = res.data.profileCompleted;
        navigate(profileCompleted ? "/dashboard" : "/profile");
      }
    } catch (err) {
      alert(err.response?.data?.message || (isRegister ? "Registration failed." : "Login failed."));
      console.error(err);
    }
  };

  return (
    <div className="register-login-container">
      <div className="left-panel">
        <h1>LinkMate</h1>
        <h2>Welcome to Our Platform</h2>
        <p>
          {isRegister ? "Already have an account? Log in now!" : "Don't have an account? Sign up!"}
        </p>
        <button onClick={toggleForm}>{isRegister ? "Switch to Login" : "Switch to Register"}</button>
      </div>
      <div className="right-panel">
        <form className="form-container" onSubmit={handleSubmit}>
          <h2>{isRegister ? "Create New Account" : "Log In"}</h2>
          {isRegister && (
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleChange}
            />
          )}
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
          />
          <button type="submit">{isRegister ? "Sign Up" : "Log In"}</button>
        </form>
      </div>
    </div>
  );
};

export default RegisterLogin;
