import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

function ConfirmFollowUpPage() {
  const location = useLocation();
  const navigate = useNavigate();


  const {
    previousAppointment,
    followUpFor,
    appointmentDate: date,
    appointmentTime: time
  } = location.state || {};

  const handleSubmit = () => {
    navigate("/submitted");
  };

  const handleBack = () => {
    navigate("/follow-up-booking", {
      state: {
        previousAppointment,
        followUpFor,
        appointmentDate: date,
        appointmentTime: time
      }
    });
  };

  return (
    <div style={{
      maxWidth: "500px",
      margin: "0 auto",
      padding: "20px",
      fontFamily: "Arial, sans-serif",
      backgroundColor: "#f9f9f9",
      borderRadius: "10px",
      boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)"
    }}>
      <h2 style={{ color: "#2C3E50", marginBottom: "20px" }}>Confirm Follow-Up Booking</h2>

      <div style={{ marginBottom: "20px", lineHeight: "1.8" }}>
        <p><strong>Previous Appointment Ref:</strong> {previousAppointment}</p>
        <p><strong>Follow-Up For:</strong> {followUpFor}</p>
        <p><strong>Date:</strong> {date}</p>
        <p><strong>Time:</strong> {time}</p>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <button
          onClick={handleBack}
          style={{
            padding: "12px 20px",
            backgroundColor: "#ecf0f1",
            color: "#2c3e50",
            border: "none",
            borderRadius: "25px",
            fontWeight: "bold",
            cursor: "pointer"
          }}
        >
          &lt;&lt; Back
        </button>

        <button
          onClick={handleSubmit}
          style={{
            padding: "12px 20px",
            backgroundColor: "#3498db",
            color: "white",
            border: "none",
            borderRadius: "25px",
            fontWeight: "bold",
            cursor: "pointer"
          }}
        >
          Submit Follow-Up Booking
        </button>
      </div>
    </div>
  );
}

export default ConfirmFollowUpPage;
