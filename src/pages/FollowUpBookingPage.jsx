import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function FollowUpBooking() {
  const [selectedPreviousAppointment, setSelectedPreviousAppointment] = useState("");
  const [followUpFor, setFollowUpFor] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");

  const navigate = useNavigate();

  const previousAppointments = [
    "CHWCS9299101975",
    "CHWCS7361204643",
    "CHWCS1018443315"
  ];

  const appointmentTypes = [
    "HIV Testing Follow-Up",
    "Mental Health Follow-Up",
    "General Consultation Follow-Up"
  ];

  const appointmentTimes = [
    "08:00", "08:30", "09:00", "09:30",
    "10:00", "10:30", "11:00"
  ];

  const handleNext = () => {
    if (selectedPreviousAppointment && followUpFor && appointmentDate && appointmentTime) {
      navigate("/confirm-follow-up", {
        state: {
          previousAppointment: selectedPreviousAppointment,
          followUpFor,
          appointmentDate,
          appointmentTime
        }
      });
    } else {
      alert("Please fill in all fields.");
    }
  };

  const handleSave = () => {
    if (selectedPreviousAppointment && followUpFor && appointmentDate && appointmentTime) {
      alert("Follow-up appointment saved successfully!");
    } else {
      alert("Please complete all fields before saving.");
    }
  };

  return (
    <div style={{ maxWidth: "500px", margin: "0 auto", padding: "20px", fontFamily: "Arial" }}>
      <h1>Follow-Up Booking</h1>
      <p><strong>Ref:</strong> WITS-0535369819</p>
      <hr />

      <h2>Appointment Type</h2>
      <p><strong>Important:</strong></p>
      <p style={{ fontStyle: "italic" }}>
        Please note that you need to book previous appointments before booking for a follow-up.
      </p>

      <label><strong>Select Previous Appointment *</strong></label>
      <p style={{ fontSize: "12px", color: "#555" }}>
        If the previous appointments are empty, you will not be able to proceed.
        You need to book an appointment before booking for a follow-up.
      </p>
      <select
        value={selectedPreviousAppointment}
        onChange={(e) => setSelectedPreviousAppointment(e.target.value)}
        style={{ width: "100%", padding: "8px", marginBottom: "15px" }}
      >
        <option value="">Select previous appointment</option>
        {previousAppointments.map(ref => (
          <option key={ref} value={ref}>{ref}</option>
        ))}
      </select>

      <label><strong>Follow-Up Appointment For *</strong></label>
      <select
        value={followUpFor}
        onChange={(e) => setFollowUpFor(e.target.value)}
        style={{ width: "100%", padding: "8px", marginBottom: "15px" }}
      >
        <option value="">Select follow-up type</option>
        {appointmentTypes.map(type => (
          <option key={type} value={type}>{type}</option>
        ))}
      </select>

      <label><strong>Appointment Date *</strong></label>
      <input
        type="date"
        value={appointmentDate}
        onChange={(e) => setAppointmentDate(e.target.value)}
        style={{ width: "100%", padding: "8px", marginBottom: "15px" }}
      />

      <label><strong>Appointment Time *</strong></label>
      <select
        value={appointmentTime}
        onChange={(e) => setAppointmentTime(e.target.value)}
        style={{ width: "100%", padding: "8px", marginBottom: "20px" }}
      >
        <option value="">Select time</option>
        {appointmentTimes.map(time => (
          <option key={time} value={time}>{time}</option>
        ))}
      </select>

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <button
          onClick={handleSave}
          style={{
            padding: "10px 20px",
            border: "2px solid #28a745",
            borderRadius: "8px",
            background: "white",
            color: "#28a745",
            fontWeight: "bold"
          }}
        >
          SAVE
        </button>
        <button
          onClick={handleNext}
          style={{
            padding: "10px 20px",
            border: "2px solid #3498db",
            borderRadius: "8px",
            background: "white",
            color: "#3498db",
            fontWeight: "bold"
          }}
        >
          NEXT &gt;&gt;
        </button>
      </div>
    </div>
  );
}

export default FollowUpBooking;