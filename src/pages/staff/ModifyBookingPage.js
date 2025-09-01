
import React, { useState } from "react";

const ModifyBookingPage = () => {
  const [studentNumber, setStudentNumber] = useState("");
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    appointmentDate: "",
    appointmentTime: "",
    appointmentFor: "",
  });

  // Search for appointments by student number
  const searchAppointments = async () => {
    if (!studentNumber.trim()) {
      setError("Please enter a student number");
      return;
    }

    setLoading(true);
    setError("");
    setAppointments([]);
    setSelectedAppointment(null);

    try {
      const response = await fetch(`http://localhost:5001/api/appointments/student/${studentNumber}`);
      const data = await response.json();

      if (response.ok) {
        setAppointments(data.appointments);
        if (data.appointments.length === 0) {
          setError("No appointments found for this student number");
        }
      } else {
        setError(data.error || "Failed to fetch appointments");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle appointment selection
  const selectAppointment = (appointment) => {
    setSelectedAppointment(appointment);
    setEditForm({
      appointmentDate: appointment.appointment_date || "",
      appointmentTime: appointment.appointment_time || "",
      appointmentFor: appointment.appointment_for || "",
    });
    setIsEditing(false);
  };

  // Handle form changes
  const handleEditChange = (e) => {
    setEditForm({
      ...editForm,
      [e.target.name]: e.target.value,
    });
  };

  // Update appointment
  const updateAppointment = async () => {
    if (!selectedAppointment) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`http://localhost:5001/api/appointments/${selectedAppointment.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editForm),
      });

      const data = await response.json();

      if (response.ok) {
        // Update the appointment in the list
        setAppointments(appointments.map(apt => 
          apt.id === selectedAppointment.id 
            ? { ...apt, ...editForm }
            : apt
        ));
        setSelectedAppointment({ ...selectedAppointment, ...editForm });
        setIsEditing(false);
        alert("Appointment updated successfully!");
      } else {
        setError(data.error || "Failed to update appointment");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Cancel appointment
  const cancelAppointment = async () => {
    if (!selectedAppointment) return;

    if (!window.confirm("Are you sure you want to cancel this appointment?")) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`http://localhost:5001/api/appointments/${selectedAppointment.id}/cancel`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok) {
        // Update the appointment status in the list
        setAppointments(appointments.map(apt => 
          apt.id === selectedAppointment.id 
            ? { ...apt, status: "cancelled" }
            : apt
        ));
        setSelectedAppointment({ ...selectedAppointment, status: "cancelled" });
        alert("Appointment cancelled successfully!");
      } else {
        setError(data.error || "Failed to cancel appointment");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Format time for display
  const formatTime = (time) => {
    if (!time) return "";
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Format date for display
  const formatDate = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString();
  };

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      <h1 style={{ marginBottom: "30px", color: "#333" }}>Modify Booking</h1>

      {/* Search Section */}
      <div style={{ 
        border: "1px solid #ddd", 
        borderRadius: "8px", 
        padding: "20px", 
        marginBottom: "20px",
        backgroundColor: "#f9f9f9"
      }}>
        <h3 style={{ marginBottom: "15px" }}>Search Student Appointments</h3>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <input
            type="text"
            value={studentNumber}
            onChange={(e) => setStudentNumber(e.target.value)}
            placeholder="Enter student number"
            style={{
              padding: "10px",
              border: "1px solid #ccc",
              borderRadius: "4px",
              flex: 1,
              fontSize: "16px"
            }}
          />
          <button
            onClick={searchAppointments}
            disabled={loading}
            style={{
              padding: "10px 20px",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: "16px"
            }}
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </div>
        {error && (
          <p style={{ color: "red", marginTop: "10px" }}>{error}</p>
        )}
      </div>

      {/* Appointments List */}
      {appointments.length > 0 && (
        <div style={{ 
          border: "1px solid #ddd", 
          borderRadius: "8px", 
          padding: "20px", 
          marginBottom: "20px"
        }}>
          <h3 style={{ marginBottom: "15px" }}>Student Appointments</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {appointments.map((appointment) => (
              <div
                key={appointment.id}
                onClick={() => selectAppointment(appointment)}
                style={{
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  padding: "15px",
                  cursor: "pointer",
                  backgroundColor: selectedAppointment?.id === appointment.id ? "#e3f2fd" : "white",
                  transition: "background-color 0.2s"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <strong>Reference:</strong> {appointment.reference_number}
                    <br />
                    <strong>Type:</strong> {appointment.appointment_type}
                    <br />
                    <strong>For:</strong> {appointment.appointment_for}
                    <br />
                    <strong>Date:</strong> {formatDate(appointment.appointment_date)}
                    <br />
                    <strong>Time:</strong> {formatTime(appointment.appointment_time)}
                  </div>
                  <div style={{ 
                    padding: "4px 8px", 
                    borderRadius: "4px", 
                    fontSize: "12px",
                    fontWeight: "bold",
                    backgroundColor: appointment.status === "cancelled" ? "#ffebee" : "#e8f5e8",
                    color: appointment.status === "cancelled" ? "#c62828" : "#2e7d32"
                  }}>
                    {appointment.status?.toUpperCase() || "SCHEDULED"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected Appointment Details and Edit Form */}
      {selectedAppointment && (
        <div style={{ 
          border: "1px solid #ddd", 
          borderRadius: "8px", 
          padding: "20px",
          backgroundColor: "#f9f9f9"
        }}>
          <h3 style={{ marginBottom: "15px" }}>Selected Appointment Details</h3>
          
          <div style={{ display: "flex", gap: "30px" }}>
            {/* Current Details */}
            <div style={{ flex: 1 }}>
              <h4>Current Details</h4>
              <p><strong>Reference:</strong> {selectedAppointment.reference_number}</p>
              <p><strong>Student Number:</strong> {selectedAppointment.student_number}</p>
              <p><strong>Type:</strong> {selectedAppointment.appointment_type}</p>
              <p><strong>For:</strong> {selectedAppointment.appointment_for}</p>
              <p><strong>Date:</strong> {formatDate(selectedAppointment.appointment_date)}</p>
              <p><strong>Time:</strong> {formatTime(selectedAppointment.appointment_time)}</p>
              <p><strong>Status:</strong> {selectedAppointment.status?.toUpperCase() || "SCHEDULED"}</p>
            </div>

            {/* Edit Form */}
            <div style={{ flex: 1 }}>
              <h4>Modify Appointment</h4>
              {isEditing ? (
                <form onSubmit={(e) => { e.preventDefault(); updateAppointment(); }}>
                  <div style={{ marginBottom: "15px" }}>
                    <label style={{ display: "block", marginBottom: "5px" }}>Appointment Date:</label>
                    <input
                      type="date"
                      name="appointmentDate"
                      value={editForm.appointmentDate}
                      onChange={handleEditChange}
                      style={{
                        width: "100%",
                        padding: "8px",
                        border: "1px solid #ccc",
                        borderRadius: "4px"
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: "15px" }}>
                    <label style={{ display: "block", marginBottom: "5px" }}>Appointment Time:</label>
                    <input
                      type="time"
                      name="appointmentTime"
                      value={editForm.appointmentTime}
                      onChange={handleEditChange}
                      style={{
                        width: "100%",
                        padding: "8px",
                        border: "1px solid #ccc",
                        borderRadius: "4px"
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: "15px" }}>
                    <label style={{ display: "block", marginBottom: "5px" }}>Appointment For:</label>
                    <input
                      type="text"
                      name="appointmentFor"
                      value={editForm.appointmentFor}
                      onChange={handleEditChange}
                      placeholder="Enter appointment reason"
                      style={{
                        width: "100%",
                        padding: "8px",
                        border: "1px solid #ccc",
                        borderRadius: "4px"
                      }}
                    />
                  </div>

                  <div style={{ display: "flex", gap: "10px" }}>
                    <button
                      type="submit"
                      disabled={loading}
                      style={{
                        padding: "8px 16px",
                        backgroundColor: "#28a745",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: loading ? "not-allowed" : "pointer"
                      }}
                    >
                      {loading ? "Saving..." : "Save Changes"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      style={{
                        padding: "8px 16px",
                        backgroundColor: "#6c757d",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer"
                      }}
                    >
                      Cancel Edit
                    </button>
                  </div>
                </form>
              ) : (
                <div>
                  <p style={{ color: "#666", marginBottom: "15px" }}>
                    Click "Edit Appointment" to modify the details, or "Cancel Appointment" to cancel it.
                  </p>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button
                      onClick={() => setIsEditing(true)}
                      disabled={selectedAppointment.status === "cancelled"}
                      style={{
                        padding: "8px 16px",
                        backgroundColor: "#007bff",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: selectedAppointment.status === "cancelled" ? "not-allowed" : "pointer"
                      }}
                    >
                      Edit Appointment
                    </button>
                    <button
                      onClick={cancelAppointment}
                      disabled={selectedAppointment.status === "cancelled" || loading}
                      style={{
                        padding: "8px 16px",
                        backgroundColor: "#dc3545",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: (selectedAppointment.status === "cancelled" || loading) ? "not-allowed" : "pointer"
                      }}
                    >
                      {loading ? "Cancelling..." : "Cancel Appointment"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModifyBookingPage;