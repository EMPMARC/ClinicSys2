import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const BookingPage = () => {
  const navigate = useNavigate();
  const [porApproved, setPorApproved] = useState(null);
  const [porLoading, setPorLoading] = useState(true);
  const [porError, setPorError] = useState("");

  useEffect(() => {
    const studentNumber = localStorage.getItem('studentNumber');
    if (!studentNumber) {
      setPorError('Missing student number. Please login again.');
      setPorLoading(false);
      return;
    }
    const check = async () => {
      try {
        const res = await fetch('http://localhost:5001/api/check-por', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentNumber })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to check POR');
        setPorApproved(Boolean(data.approved));
      } catch (e) {
        setPorError(e.message);
      } finally {
        setPorLoading(false);
      }
    };
    check();
  }, []);

  const handleAppointmentSelection = (type) => {
    if (!porApproved) {
      alert('You cannot book an appointment until your proof of registration has been approved by admin.');
      return;
    }
    if (type === "followup") {
      navigate("/follow-up-booking");
    } else if (type === "wellness") {
      navigate("/health-wellness-booking");
    }
  };

  const handleClose = () => {
    const confirmClose = window.confirm("Are you sure you want to exit and return to the login page?");
    if (confirmClose) {
      navigate("/"); // Go back to login
    }
  };

  return (
    <div style={containerStyle}>
      <h1 style={titleStyle}>Campus Health And Wellness Centre</h1>
      <div style={cardStyle}>
        <h2 style={sectionTitleStyle}>Select Appointment Type</h2>
        <hr />
        {porLoading && (
          <div style={{ color: '#6c757d', marginBottom: '10px' }}>Checking approval status...</div>
        )}
        {!porLoading && !porApproved && (
          <div style={{
            marginBottom: '10px',
            padding: '10px',
            backgroundColor: '#fff3cd',
            color: '#856404',
            border: '1px solid #ffeeba',
            borderRadius: '8px'
          }}>
            Your proof of registration is not approved yet. Please upload it on the Upload Proof page and wait for admin approval.
          </div>
        )}
        {porError && (
          <div style={{ color: '#dc3545', marginBottom: '10px' }}>{porError}</div>
        )}
        <div style={{ marginTop: "20px" }}>
          <button
            style={appointmentButtonStyle}
            onClick={() => handleAppointmentSelection("followup")}
            disabled={!porApproved}
          >
            1. Follow-Up Booking
          </button>
          <button
            style={appointmentButtonStyle}
            onClick={() => handleAppointmentSelection("wellness")}
            disabled={!porApproved}
          >
            2. Health and Wellness Booking (Main Campus)
          </button>
        </div>
        <button style={closeButtonStyle} onClick={handleClose}>
          CLOSE
        </button>
      </div>
    </div>
  );
};

// Styles
const containerStyle = {
  padding: "30px",
  fontFamily: "Arial, sans-serif",
  backgroundColor: "#f5f8fa",
  minHeight: "100vh",
};

const titleStyle = {
  textAlign: "center",
  marginBottom: "30px",
  color: "#003366",
};

const cardStyle = {
  maxWidth: "450px",
  margin: "0 auto",
  padding: "30px",
  borderRadius: "15px",
  backgroundColor: "#ffffff",
  boxShadow: "0 4px 16px rgba(0, 0, 0, 0.1)",
};

const sectionTitleStyle = {
  fontSize: "20px",
  fontWeight: "600",
  marginBottom: "10px",
  color: "#003366",
};

const appointmentButtonStyle = {
  display: "block",
  width: "100%",
  marginBottom: "15px",
  padding: "14px",
  fontSize: "16px",
  textAlign: "left",
  backgroundColor: "#d6eaff",
  border: "1px solid #0b5ed7",
  borderRadius: "12px",
  cursor: "pointer",
  color: "#0b5ed7",
  fontWeight: "500",
};

const closeButtonStyle = {
  marginTop: "25px",
  backgroundColor: "#28a745",
  border: "none",
  padding: "12px 20px",
  borderRadius: "20px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  cursor: "pointer",
  width: "100%",
};

export default BookingPage;