import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function HealthAndWellnessPage() {
  const [selectedService, setSelectedService] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const navigate = useNavigate();

  const services = [
    "General Consultation",
    "HIV Testing and Counselling - Free Service",
    "Mental Health - Free Service"
  ];

  const times = [
    "08:00", "08:30", "09:00", "09:30",
    "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30",
    "14:00", "14:30", "15:00", "15:30"
  ];

  const requiresDate = [
    "HIV Testing and Counselling - Free Service",
    "Mental Health - Free Service"
  ];

  const handleNext = () => {
    if (!selectedService || !appointmentTime || (requiresDate.includes(selectedService) && !appointmentDate)) {
      alert("Please fill in all required fields.");
      return;
    }

    navigate("/confirm-booking", {
      state: {
        service: selectedService,
        date: appointmentDate,
        time: appointmentTime,
      },
    });
  };

  const handleSave = () => {
    if (!selectedService || !appointmentTime || (requiresDate.includes(selectedService) && !appointmentDate)) {
      alert("Please complete all required fields before saving.");
      return;
    }

    alert("Booking details saved successfully!");
  };

  return (
    <div style={{ maxWidth: "500px", margin: "0 auto", padding: "20px", fontFamily: "Arial" }}>
      <h1 style={{ color: "#2C3E50" }}>Health and Wellness Booking (Main Campus)</h1>
      
      <p><strong>Main Campus Health and Wellness Centre</strong></p>
      <p>
        Campus Health offers services such as: Primary Health care, Family Planning, Mental Health, Emergency Care, Dispensary, HCT (VCT), Wellness Programs, Private Medical Practitioner to staff, students and Wits community. 
        Some of these services are free such as HIV testing, Counselling and Reproductive health.
      </p>
      <p>
        <strong>SERVICE HOURS:</strong> Monday - Friday, 08:00 to 15:30<br />
        <strong>FOLLOW-UP:</strong> Monday - Friday, 08:00 to 11:00
      </p>
      <p>
        If you must <strong>cancel</strong> an appointment, we request for <strong>2 hours</strong> notice, in order to allow other bookings. <br />
        <strong>Please note:</strong> General Consultations can <strong>only</strong> be booked daily on the day of consultation.
      </p>

      <div style={{ marginTop: "20px" }}>
        <label><strong>Appointment for *</strong></label>
        <select
          value={selectedService}
          onChange={(e) => setSelectedService(e.target.value)}
          required
          style={{ display: "block", width: "100%", padding: "8px", marginBottom: "15px" }}
        >
          <option value="">Select service</option>
          {services.map((service) => (
            <option key={service} value={service}>
              {service}
            </option>
          ))}
        </select>

        {requiresDate.includes(selectedService) && (
          <div style={{ marginBottom: "15px" }}>
            <label><strong>Appointment Date *</strong></label>
            <input
              type="date"
              value={appointmentDate}
              onChange={(e) => setAppointmentDate(e.target.value)}
              required
              style={{ display: "block", width: "100%", padding: "8px" }}
            />
          </div>
        )}

        <label><strong>Appointment Time *</strong></label>
        <select
          value={appointmentTime}
          onChange={(e) => setAppointmentTime(e.target.value)}
          required
          style={{ display: "block", width: "100%", padding: "8px", marginBottom: "20px" }}
        >
          <option value="">Select time</option>
          {times.map((time) => (
            <option key={time} value={time}>
              {time}
            </option>
          ))}
        </select>

        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <button
            onClick={handleSave}
            style={{
              padding: "10px 20px",
              border: "2px solid #0d6efd",
              borderRadius: "8px",
              background: "white",
              color: "#0d6efd",
              fontWeight: "bold"
            }}
          >
            SAVE
          </button>
          <button
            onClick={handleNext}
            style={{
              padding: "10px 20px",
              border: "2px solid #0d6efd",
              borderRadius: "8px",
              background: "white",
              color: "#0d6efd",
              fontWeight: "bold"
            }}
          >
            NEXT &gt;&gt;
          </button>
        </div>

        <button
          style={{
            marginTop: "20px",
            width: "100%",
            padding: "12px",
            background: "#28a745",
            border: "none",
            color: "white",
            borderRadius: "25px",
            fontWeight: "bold"
          }}
        >
          DISCARD THIS APPOINTMENT
        </button>
      </div>
    </div>
  );
}

export default HealthAndWellnessPage;