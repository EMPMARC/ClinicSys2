
import React, { useState } from "react";

const ModifyBookingPage = () => {
  const [formData, setFormData] = useState({
    patientName: "",
    appointmentDate: "",
    appointmentTime: "",
    serviceType: "",
    reasonForChange: "",
    newStaffMember: "",
  });

  // Placeholder current booking details
  const currentBooking = {
    patientName: "John Doe",
    appointmentDate: "2025-08-15",
    appointmentTime: "10:00 AM",
    serviceType: "General Checkup",
    staffMember: "Dr. Smith",
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Booking changes submitted (placeholder). Data: " + JSON.stringify(formData, null, 2));
  };

  return (
    <div style={{ display: "flex", gap: "30px", padding: "20px" }}>
      {/* Modify Booking Form */}
      <div style={{ flex: 2, border: "1px solid #ccc", borderRadius: "8px", padding: "20px" }}>
        <h2>Modify Booking</h2>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          <div>
            <label>Patient Name:</label>
            <input
              type="text"
              name="patientName"
              value={formData.patientName}
              onChange={handleChange}
              placeholder="Enter patient name"
            />
          </div>

          <div>
            <label>Appointment Date:</label>
            <input
              type="date"
              name="appointmentDate"
              value={formData.appointmentDate}
              onChange={handleChange}
            />
          </div>

          <div>
            <label>Appointment Time:</label>
            <input
              type="time"
              name="appointmentTime"
              value={formData.appointmentTime}
              onChange={handleChange}
            />
          </div>

          <div>
            <label>Service Type:</label>
            <input
              type="text"
              name="serviceType"
              value={formData.serviceType}
              onChange={handleChange}
              placeholder="Enter service type"
            />
          </div>

          <div>
            <label>Reason for Change:</label>
            <textarea
              name="reasonForChange"
              value={formData.reasonForChange}
              onChange={handleChange}
              placeholder="Explain why the booking is being modified"
            />
          </div>

          <div>
            <label>New Staff Member:</label>
            <input
              type="text"
              name="newStaffMember"
              value={formData.newStaffMember}
              onChange={handleChange}
              placeholder="Enter new staff member"
            />
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button type="submit">Save Changes</button>
            <button type="button" onClick={() => alert("Cancelled")}>
              Cancel
            </button>
          </div>
        </form>
      </div>

      {/* Current Booking Details */}
      <div style={{ flex: 1, border: "1px solid #ccc", borderRadius: "8px", padding: "20px" }}>
        <h3>Current Booking</h3>
        <p><strong>Patient:</strong> {currentBooking.patientName}</p>
        <p><strong>Date:</strong> {currentBooking.appointmentDate}</p>
        <p><strong>Time:</strong> {currentBooking.appointmentTime}</p>
        <p><strong>Service:</strong> {currentBooking.serviceType}</p>
        <p><strong>Staff:</strong> {currentBooking.staffMember}</p>
      </div>
    </div>
  );
};

export default ModifyBookingPage;