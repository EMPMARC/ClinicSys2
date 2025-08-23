import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const ConfirmBooking = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const reference = 'CHWCS' + Math.floor(Math.random() * 1000000000);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const staffNumber = localStorage.getItem('staffNumber');

  const handleSubmit = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/save-appointment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          referenceNumber: reference,
          userId: user.id,
          staffNumber: staffNumber,
          appointmentType: "Health and Wellness Booking",
          appointmentFor: state.service,
          appointmentDate: state.date,
          appointmentTime: state.time,
          previousAppointmentRef: null
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save appointment');
      }

      navigate('/submitted');
    } catch (error) {
      console.error('Error saving appointment:', error);
      alert('Failed to save appointment. Please try again.');
    }
  };

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
      <p><strong>Appointment for:</strong> {state.service}</p>
      {state.date && <p><strong>Appointment Date:</strong> {state.date}</p>}
      <p><strong>Appointment Time:</strong> {state.time}</p>

      <div className="flex justify-between mt-4">
        <button className="bg-gray-400 text-white px-4 py-2 rounded" onClick={() => navigate(-1)}>&lt;&lt; Back</button>
        <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={handleSubmit}>Submit</button>
      </div>

      <button className="bg-orange-500 text-white mt-4 px-4 py-2 w-full rounded">Discard This Appointment</button>
    </div>
  );
};

export default ConfirmBooking;