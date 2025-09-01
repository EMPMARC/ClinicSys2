import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const ConfirmBooking = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const reference = 'CHWCS' + Math.floor(Math.random() * 1000000000);
  
  // Get data from navigation state
  const { service, date, time, studentNumber } = state || {};

  const handleSubmit = async () => {
    try {
      console.log('Sending appointment data:', {
        referenceNumber: reference,
        studentNumber: studentNumber,
        appointmentType: "Health and Wellness Booking",
        appointmentFor: service,
        appointmentDate: date,
        appointmentTime: time,
        previousAppointmentRef: null
      });

      const response = await fetch('http://localhost:5001/api/save-appointment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          referenceNumber: reference,
          studentNumber: studentNumber,
          appointmentType: "Health and Wellness Booking",
          appointmentFor: service,
          appointmentDate: date,
          appointmentTime: time,
          previousAppointmentRef: null
        }),
      });

      const data = await response.json();
      console.log('Server response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save appointment');
      }

      navigate('/submitted');
    } catch (error) {
      console.error('Error saving appointment:', error);
      alert('Failed to save appointment: ' + error.message);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

<<<<<<< HEAD
  const handleDiscard = () => {
    const confirmDiscard = window.confirm("Are you sure you want to discard this appointment?");
    if (confirmDiscard) {
      navigate('/booking');
    }
  };

  if (!state) {
    return (
      <div style={containerStyle}>
        <h1 style={titleStyle}>Campus Health And Wellness Centre</h1>
        <div style={cardStyle}>
          <h2 style={sectionTitleStyle}>Error</h2>
          <hr />
          <p style={errorTextStyle}>No appointment data found. Please start over.</p>
          <button 
            onClick={() => navigate('/booking')}
            style={primaryButtonStyle}
          >
            Go Back to Booking
          </button>
        </div>
=======
  if (!state) {
    return (
      <div className="p-4 max-w-md mx-auto">
        <h2 className="text-2xl font-bold mb-4">Error</h2>
        <p>No appointment data found. Please start over.</p>
        <button 
          onClick={() => navigate('/booking')}
          className="bg-blue-600 text-white px-4 py-2 rounded mt-4"
        >
          Go Back to Booking
        </button>
>>>>>>> a118ad8ca2335672b7eac97b7da45893d0ae689f
      </div>
    );
  }

  return (
<<<<<<< HEAD
    <div style={containerStyle}>
      <h1 style={titleStyle}>Campus Health And Wellness Centre</h1>
      <div style={cardStyle}>
        <h2 style={sectionTitleStyle}>Confirm Booking</h2>
        <hr />
        
        <div style={infoSectionStyle}>
          <div style={referenceStyle}>
            <strong>Reference Number:</strong> {reference}
          </div>
          
          <div style={campusInfoStyle}>
            Main Campus Health and Wellness Centre
          </div>
          
          <div style={detailsContainerStyle}>
            <div style={detailRowStyle}>
              <span style={labelStyle}>Appointment for:</span>
              <span style={valueStyle}>{service}</span>
            </div>
            {date && (
              <div style={detailRowStyle}>
                <span style={labelStyle}>Appointment Date:</span>
                <span style={valueStyle}>{date}</span>
              </div>
            )}
            <div style={detailRowStyle}>
              <span style={labelStyle}>Appointment Time:</span>
              <span style={valueStyle}>{time}</span>
            </div>
            <div style={detailRowStyle}>
              <span style={labelStyle}>Student Number:</span>
              <span style={valueStyle}>{studentNumber}</span>
            </div>
          </div>
        </div>

        <div style={buttonContainerStyle}>
          <button 
            style={secondaryButtonStyle}
            onClick={handleBack}
          >
            &lt;&lt; Back
          </button>
          <button 
            style={primaryButtonStyle}
            onClick={handleSubmit}
          >
            Submit
          </button>
        </div>

        <button 
          style={discardButtonStyle}
          onClick={handleDiscard}
        >
          Discard This Appointment
        </button>
      </div>
=======
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-2">Health and Wellness Booking (Main Campus)</h2>
      <p><strong>Ref:</strong> {reference}</p>

      <h3 className="mt-4 font-semibold">Confirm Booking</h3>
      <p className="text-sm mb-4">
        Preview your submission<br />
        <strong>Ref:</strong> {reference}
      </p>

      <div className="bg-blue-100 p-2 rounded mb-3">
        Main Campus Health and Wellness Centre
      </div>
      <p><strong>Appointment for:</strong> {service}</p>
      {date && <p><strong>Appointment Date:</strong> {date}</p>}
      <p><strong>Appointment Time:</strong> {time}</p>
      <p><strong>Student Number:</strong> {studentNumber}</p>

      <div className="flex justify-between mt-4">
        <button 
          className="bg-gray-400 text-white px-4 py-2 rounded" 
          onClick={handleBack}
        >
          &lt;&lt; Back
        </button>
        <button 
          className="bg-blue-600 text-white px-4 py-2 rounded" 
          onClick={handleSubmit}
        >
          Submit
        </button>
      </div>

      <button className="bg-orange-500 text-white mt-4 px-4 py-2 w-full rounded">
        Discard This Appointment
      </button>
>>>>>>> a118ad8ca2335672b7eac97b7da45893d0ae689f
    </div>
  );
};

<<<<<<< HEAD
// Styles matching BookingPage design
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

const infoSectionStyle = {
  marginTop: "20px",
};

const referenceStyle = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#0b5ed7",
  marginBottom: "15px",
  padding: "10px",
  backgroundColor: "#f8f9fa",
  borderRadius: "8px",
  border: "1px solid #e9ecef",
};

const campusInfoStyle = {
  backgroundColor: "#d6eaff",
  border: "1px solid #0b5ed7",
  borderRadius: "12px",
  padding: "12px",
  marginBottom: "20px",
  color: "#0b5ed7",
  fontWeight: "500",
  textAlign: "center",
};

const detailsContainerStyle = {
  marginBottom: "25px",
};

const detailRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "10px 0",
  borderBottom: "1px solid #e9ecef",
};

const labelStyle = {
  fontWeight: "600",
  color: "#495057",
  fontSize: "14px",
};

const valueStyle = {
  color: "#212529",
  fontSize: "14px",
  fontWeight: "500",
};

const buttonContainerStyle = {
  display: "flex",
  gap: "15px",
  marginBottom: "20px",
};

const primaryButtonStyle = {
  backgroundColor: "#0b5ed7",
  border: "none",
  padding: "12px 20px",
  borderRadius: "20px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  cursor: "pointer",
  flex: "1",
};

const secondaryButtonStyle = {
  backgroundColor: "#6c757d",
  border: "none",
  padding: "12px 20px",
  borderRadius: "20px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  cursor: "pointer",
  flex: "1",
};

const discardButtonStyle = {
  backgroundColor: "#dc3545",
  border: "none",
  padding: "12px 20px",
  borderRadius: "20px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  cursor: "pointer",
  width: "100%",
};

const errorTextStyle = {
  color: "#dc3545",
  marginBottom: "20px",
  textAlign: "center",
};

=======
>>>>>>> a118ad8ca2335672b7eac97b7da45893d0ae689f
export default ConfirmBooking;