import React from "react";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    navigate("/");
  };

  // Styles
  const containerStyle = {
    fontFamily: "Arial, sans-serif",
    backgroundColor: "#f5f7fa",
    minHeight: "100vh",
    padding: "20px",
  };

  const headerStyle = {
    backgroundColor: "#4a4a4a",
    color: "white",
    padding: "15px 20px",
    borderRadius: "8px",
    textAlign: "center",
    marginBottom: "30px",
  };

  const buttonContainerStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
    maxWidth: "400px",
    margin: "0 auto",
  };

  const buttonStyle = {
    padding: "12px 20px",
    border: "none",
    borderRadius: "6px",
    fontSize: "16px",
    cursor: "pointer",
    backgroundColor: "#007bff",
    color: "white",
    boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
    transition: "0.3s",
  };

  const logoutStyle = {
    ...buttonStyle,
    backgroundColor: "#dc3545",
    marginTop: "25px",
  };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <h1>Welcome, {user?.name || "Admin"}</h1>
        <p>Choose what you want to do today:</p>
      </div>

      {/* Buttons */}
      <div style={buttonContainerStyle}>
        <button style={buttonStyle} onClick={() => navigate("/staff-schedule")}>
          View / Manage Schedule
        </button>
        <button style={buttonStyle} onClick={() => navigate("/emergency-onboarding")}>
          Emergency Onboarding
        </button>
        <button style={buttonStyle} onClick={() => navigate("/modify-booking")}>
          Modify Booking
        </button>
        <button style={buttonStyle} onClick={() => navigate("/approve-proof")}>
          Approve Proof of Registration
        </button>

        {/* Reports Button */}
        <button style={buttonStyle} onClick={() => navigate("/new-report")}>
          Generate Reports
        </button>
      </div>

      {/* Logout */}
      <div style={{ textAlign: "center" }}>
        <button style={logoutStyle} onClick={logout}>
          Log out
        </button>
      </div>
    </div>
  );
};

export default AdminDashboard;