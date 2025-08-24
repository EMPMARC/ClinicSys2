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

  return (
    <div style={{ padding: 24 }}>
      <h1>Welcome, {user?.name || "Admin"}</h1>
      <p>Choose what you want to do today:</p>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 20 }}>
        <button onClick={() => navigate("/staff-schedule")}>View / Manage Schedule</button>
        <button onClick={() => navigate("/emergency-onboarding")}>Emergency Onboarding</button>
        <button onClick={() => navigate("/modify-booking")}>Modify Booking</button>
        {/* Visible for all staff during testing */}
        <button onClick={() => navigate("/approve-proof")}>Approve Proof of Registration</button>
      </div>

      <div style={{ marginTop: 24 }}>
        <button onClick={logout}>Log out</button>
      </div>
    </div>
  );
};

export default AdminDashboard;