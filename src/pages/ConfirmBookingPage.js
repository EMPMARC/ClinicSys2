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
      </div>
    );
  }

  return (
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
    </div>
  );
};

export default ConfirmBooking;