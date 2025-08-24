import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const PatientDashboard = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const staffNumber = localStorage.getItem("staffNumber");
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);

  // Get progress from localStorage (default all)
  const progress = JSON.parse(localStorage.getItem("patientProgress") || "{}");

  useEffect(() => {
    // Fetch user appointments when component mounts
    const fetchAppointments = async () => {
      try {
        const response = await fetch(`http://localhost:5001/api/user-appointments/${staffNumber}`);
        const data = await response.json();
        
        if (response.ok) {
          setAppointments(data.appointments);
        } else {
          console.error('Failed to fetch appointments:', data.error);
        }
      } catch (error) {
        console.error('Error fetching appointments:', error);
      }
    };

    if (staffNumber) {
      fetchAppointments();
    }
  }, [staffNumber]);

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    localStorage.removeItem("staffNumber");
    localStorage.removeItem("patientProgress");
    navigate("/");
  };

  const completeStep = (step) => {
    const newProgress = { ...progress, [step]: true };
    localStorage.setItem("patientProgress", JSON.stringify(newProgress));
  };

  const handleClick = (action) => {
    if (action === "upload-proof" && !progress.onboarding) {
      alert("Please complete onboarding first.");
      return;
    }
    if (action === "booking" && !progress.proofUploaded) {
      alert("Please upload and get your proof of registration approved first.");
      return;
    }
    if (action === "health-wellness-booking" && !progress.booking) {
      alert("Please book your first appointment before accessing Health & Wellness Booking.");
      return;
    }
    if (action === "follow-up-booking" && !progress.booking) {
      alert("You must have a previous appointment before making a follow-up booking.");
      return;
    }
    if (action === "my-submissions" && !progress.submission) {
      alert("No submissions found. Please submit something first.");
      return;
    }

    // Simulate marking a step as done (remove this in real version)
    if (action === "onboarding") completeStep("onboarding");
    if (action === "upload-proof") completeStep("proofUploaded");
    if (action === "booking") completeStep("booking");
    if (action === "my-submissions") completeStep("submission");

    navigate("/" + action);
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "Date not set";
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Format time for display
  const formatTime = (timeString) => {
    if (!timeString) return "Time not set";
    
    const time = timeString.split(':');
    const hours = parseInt(time[0]);
    const minutes = time[1];
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    
    return `${formattedHours}:${minutes} ${ampm}`;
  };

  // Get appointment status based on date
  const getAppointmentStatus = (appointmentDate) => {
    if (!appointmentDate) return "scheduled";
    
    const today = new Date();
    const appointment = new Date(appointmentDate);
    
    if (appointment < today) return "completed";
    if (appointment.toDateString() === today.toDateString()) return "today";
    return "upcoming";
  };

  return (
    <div style={{ padding: 24, fontFamily: 'Arial, sans-serif', maxWidth: 800, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ color: '#2c3e50', margin: 0 }}>Welcome, {user?.name || "Patient"}</h1>
        <button 
          onClick={logout}
          style={{
            padding: '8px 16px',
            backgroundColor: '#e74c3c',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer'
          }}
        >
          Log out
        </button>
      </div>
      
      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: 20, 
        borderRadius: 8, 
        marginBottom: 24,
        borderLeft: '4px solid #3498db'
      }}>
        <h2 style={{ color: '#2c3e50', marginTop: 0 }}>What would you like to do today?</h2>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
          <button 
            onClick={() => handleClick("onboarding")}
            style={{
              padding: '12px',
              backgroundColor: progress.onboarding ? '#27ae60' : '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            {progress.onboarding ? '✓ ' : ''}Start Onboarding
          </button>
          <button 
            onClick={() => handleClick("upload-proof")}
            style={{
              padding: '12px',
              backgroundColor: progress.proofUploaded ? '#27ae60' : '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            {progress.proofUploaded ? '✓ ' : ''}Upload Proof
          </button>
          <button 
            onClick={() => handleClick("booking")}
            style={{
              padding: '12px',
              backgroundColor: progress.booking ? '#27ae60' : '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            {progress.booking ? '✓ ' : ''}Book New Appointment
          </button>
          <button 
            onClick={() => handleClick("health-wellness-booking")}
            style={{
              padding: '12px',
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            Health & Wellness Booking
          </button>
          <button 
            onClick={() => handleClick("follow-up-booking")}
            style={{
              padding: '12px',
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            Follow-up Booking
          </button>
          <button 
            onClick={() => handleClick("my-submissions")}
            style={{
              padding: '12px',
              backgroundColor: progress.submission ? '#27ae60' : '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            {progress.submission ? '✓ ' : ''}View My Submissions
          </button>
        </div>
      </div>

      <div style={{ marginTop: 32 }}>
        <h2 style={{ color: '#2c3e50', borderBottom: '2px solid #ecf0f1', paddingBottom: 8 }}>
          Your Appointments
          {appointments.length > 0 && <span style={{ fontSize: '0.8em', color: '#7f8c8d', marginLeft: 10 }}>
            ({appointments.length} {appointments.length === 1 ? 'appointment' : 'appointments'})
          </span>}
        </h2>
        
        {appointments.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {appointments.map(appt => {
              const status = getAppointmentStatus(appt.appointment_date);
              const statusColors = {
                upcoming: '#3498db',
                today: '#e67e22',
                completed: '#27ae60',
                scheduled: '#95a5a6'
              };
              
              return (
                <div 
                  key={appt.id} 
                  style={{
                    border: '1px solid #ddd',
                    borderRadius: 8,
                    padding: 16,
                    backgroundColor: 'white',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      display: 'inline-block', 
                      backgroundColor: statusColors[status],
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: 4,
                      fontSize: '0.7em',
                      fontWeight: 'bold',
                      marginBottom: 8
                    }}>
                      {status.toUpperCase()}
                    </div>
                    <h3 style={{ margin: '8px 0', color: '#2c3e50' }}>{appt.appointment_for}</h3>
                    <div style={{ color: '#7f8c8d', fontSize: '0.9em' }}>
                      <div>
                        <strong>Date:</strong> {formatDate(appt.appointment_date)}
                      </div>
                      <div>
                        <strong>Time:</strong> {formatTime(appt.appointment_time)}
                      </div>
                      <div>
                        <strong>Reference:</strong> {appt.reference_number}
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ textAlign: 'right' }}>
                    <button
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#3498db',
                        color: 'white',
                        border: 'none',
                        borderRadius: 4,
                        cursor: 'pointer',
                        fontSize: '0.9em'
                      }}
                      onClick={() => {
                        // Add functionality for viewing appointment details
                        alert(`Appointment details for ${appt.reference_number}`);
                      }}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ 
            textAlign: 'center', 
            padding: 40, 
            backgroundColor: '#f8f9fa', 
            borderRadius: 8,
            color: '#7f8c8d'
          }}>
            <p style={{ fontSize: '1.2em', marginBottom: 16 }}>No appointments scheduled yet</p>
            <button 
              onClick={() => handleClick("booking")}
              style={{
                padding: '10px 20px',
                backgroundColor: '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer'
              }}
            >
              Book Your First Appointment
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientDashboard;