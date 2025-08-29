import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const PatientDashboard = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const studentNumber = localStorage.getItem("studentNumber");
  const navigate = useNavigate();
  const [appointmentCount, setAppointmentCount] = useState(0);

  // Get progress from localStorage (default all)
  const progress = JSON.parse(localStorage.getItem("patientProgress") || "{}");

  useEffect(() => {
    // Fetch appointment count
    const fetchAppointmentCount = async () => {
      try {
        const response = await fetch(`http://localhost:5001/api/student-appointments/${studentNumber}`);
        const data = await response.json();
        
        if (response.ok) {
          setAppointmentCount(data.appointments.length);
        } else {
          console.error('Failed to fetch appointment count:', data.error);
        }
      } catch (error) {
        console.error('Error fetching appointment count:', error);
      }
    };

    // Check current onboarding and POR status (in case they were updated elsewhere)
    const checkCurrentStatus = async () => {
      try {
        const onboardingResponse = await fetch('http://localhost:5001/api/check-onboarding', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ studentNumber }),
        });
        
        const onboardingData = await onboardingResponse.json();
        
        const porResponse = await fetch(`http://localhost:5001/api/student-files/${studentNumber}`);
        const porData = await porResponse.json();
        
        if (onboardingResponse.ok && porResponse.ok) {
          const currentProgress = {
            onboarding: onboardingData.exists,
            proofUploaded: porData.files && porData.files.length > 0,
            booking: progress.booking || false,
            submission: progress.submission || false
          };
          
          localStorage.setItem('patientProgress', JSON.stringify(currentProgress));
        }
      } catch (error) {
        console.error('Error checking current status:', error);
      }
    };

    if (studentNumber) {
      fetchAppointmentCount();
      checkCurrentStatus();
    }
  }, [studentNumber, progress.booking, progress.submission]);

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    localStorage.removeItem("studentNumber");
    localStorage.removeItem("userType");
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

    // Simulate marking a step as done (remove this in real version)
    if (action === "onboarding") completeStep("onboarding");
    if (action === "upload-proof") completeStep("proofUploaded");
    if (action === "booking") completeStep("booking");
    if (action === "my-submissions") completeStep("submission");

    navigate("/" + action);
  };

  return (
    <div style={{ padding: 24, fontFamily: 'Arial, sans-serif', maxWidth: 800, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ color: '#2c3e50', margin: 0 }}>Welcome, {user?.full_name || "Student"}</h1>
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
        </div>
      </div>

      {/* Quick Overview Section */}
      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: 20, 
        borderRadius: 8, 
        marginBottom: 24,
        borderLeft: '4px solid #2ecc71'
      }}>
        <h2 style={{ color: '#2c3e50', marginTop: 0 }}>Quick Overview</h2>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ color: '#2c3e50', margin: 0 }}>Appointments</h3>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#3498db', margin: '5px 0' }}>
              {appointmentCount}
            </p>
            <p style={{ margin: 0, color: '#7f8c8d' }}>Total appointments</p>
          </div>
          
          <button 
            onClick={() => handleClick("my-submissions")}
            style={{
              padding: '10px 20px',
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer'
            }}
          >
            View My Submissions
          </button>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;