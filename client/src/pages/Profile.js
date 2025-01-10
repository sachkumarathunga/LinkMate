import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/components/profile.css";

const Profile = ({ setProfileCompleted }) => {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState({
    fullName: "",
    age: "",
    gender: "",
    interests: "",
  });
  const [profileImage, setProfileImage] = useState(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5000/api/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data) {
          setProfileData({
            fullName: res.data.fullName,
            age: res.data.age,
            gender: res.data.gender,
            interests: res.data.interests.join(", "),
          });
          setProfileImage(
            res.data.profilePicture
              ? `http://localhost:5000${res.data.profilePicture}`
              : null
          );
        }
      } catch (err) {
        console.error("Error fetching profile:", err.response?.data?.message || err.message);
      }
    };

    fetchProfileData();
  }, []);

  const handleChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append("profilePicture", file);

      try {
        const token = localStorage.getItem("token");
        const res = await axios.post("http://localhost:5000/api/profile/upload", formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });
        setProfileImage(`http://localhost:5000${res.data.profilePicture}`);
      } catch (err) {
        console.error("Error uploading image:", err.response?.data?.message || err.message);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        "http://localhost:5000/api/profile",
        {
          ...profileData,
          interests: profileData.interests.split(",").map((interest) => interest.trim()),
          profilePicture: profileImage ? profileImage.replace("http://localhost:5000", "") : "",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      localStorage.setItem("profileCompleted", "true");
      setProfileCompleted(true);
      navigate("/dashboard");
    } catch (err) {
      console.error("Error updating profile:", err.response?.data?.message || err.message);
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-left">
        <div className="image-upload">
          <div className="profile-image-wrapper">
            <img
              src={profileImage || "/assets/default-avatar.png"}
              alt="Profile"
              className="profile-image"
            />
          </div>
          <label htmlFor="file-input" className="upload-btn">
            Change Profile Picture
          </label>
          <input
            id="file-input"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="file-input"
          />
        </div>
      </div>
      <div className="profile-right">
        <form onSubmit={handleSubmit} className="profile-form">
          <h1 className="profile-heading">Complete Your Profile</h1>
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              name="fullName"
              placeholder="Enter your full name"
              value={profileData.fullName}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Age</label>
            <input
              type="number"
              name="age"
              placeholder="Enter your age"
              value={profileData.age}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Gender</label>
            <select name="gender" value={profileData.gender} onChange={handleChange}>
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="form-group">
            <label>Interests</label>
            <textarea
              name="interests"
              placeholder="Enter interests separated by commas"
              value={profileData.interests}
              onChange={handleChange}
            />
          </div>
          <button type="submit" className="save-profile-btn">
            Save Profile
          </button>
          {/* Cancel Button */}
          <button
            type="button"
            className="cancel-profile-btn"
            onClick={() => navigate("/dashboard")}
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
