import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const ConfirmBooking = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const reference = 'CHWCS' + Math.floor(Math.random() * 1000000000);

  const handleSubmit = () => {
    navigate('/submitted');
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
      <p><strong>Appointment for:</strong> {state.appointmentType}</p>
      {state.appointmentDate && <p><strong>Appointment Date:</strong> {state.appointmentDate}</p>}
      <p><strong>Appointment Time:</strong> {state.appointmentTime}</p>

      <div className="flex justify-between mt-4">
        <button className="bg-gray-400 text-white px-4 py-2 rounded" onClick={() => navigate(-1)}>&lt;&lt; Back</button>
        <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={handleSubmit}>Submit</button>
      </div>

      <button className="bg-orange-500 text-white mt-4 px-4 py-2 w-full rounded">Discard This Appointment</button>
    </div>
  );
};

export default ConfirmBooking;