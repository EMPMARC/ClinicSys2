import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const MySubmissionsPage = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const staffNumber = localStorage.getItem('staffNumber');

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        if (!staffNumber) {
          setError('No staff/student number found. Please log in again.');
          setLoading(false);
          return;
        }

        const response = await fetch(`http://localhost:5001/api/user-appointments/${staffNumber}`);
        const data = await response.json();
        
        if (response.ok) {
          setAppointments(data.appointments);
        } else {
          setError(data.error || 'Failed to fetch appointments');
        }
      } catch (err) {
        setError('Error connecting to server. Please try again later.');
        console.error('Error fetching appointments:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [staffNumber]);

  const handleExit = () => {
    navigate('/patient-dashboard');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      scheduled: { color: 'bg-blue-100 text-blue-800', text: 'Scheduled' },
      completed: { color: 'bg-green-100 text-green-800', text: 'Completed' },
      cancelled: { color: 'bg-red-100 text-red-800', text: 'Cancelled' }
    };
    
    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', text: 'Unknown' };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 py-8">
      <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-4xl">
        <h2 className="text-3xl font-bold text-blue-900 mb-4">My Appointments</h2>
        <p className="text-gray-700 mb-6">
          Here are all your scheduled appointments with the Campus Health and Wellness Centre.
        </p>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {appointments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-3 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                  <th className="py-3 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="py-3 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                  <th className="py-3 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="py-3 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  <th className="py-3 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="py-3 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booked On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {appointments.map((appointment) => (
                  <tr key={appointment.id} className="hover:bg-gray-50">
                    <td className="py-4 px-4 border-b">
                      <span className="font-mono text-blue-600">{appointment.reference_number}</span>
                    </td>
                    <td className="py-4 px-4 border-b">{appointment.appointment_type}</td>
                    <td className="py-4 px-4 border-b">{appointment.appointment_for}</td>
                    <td className="py-4 px-4 border-b">{formatDate(appointment.appointment_date)}</td>
                    <td className="py-4 px-4 border-b">{formatTime(appointment.appointment_time)}</td>
                    <td className="py-4 px-4 border-b">{getStatusBadge(appointment.status)}</td>
                    <td className="py-4 px-4 border-b">{formatDate(appointment.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
            </div>
            <p className="text-gray-500 text-lg">You don't have any appointments yet.</p>
            <p className="text-gray-400 mt-2">Book your first appointment to get started.</p>
          </div>
        )}

        <div className="text-center mt-8">
          <button
            onClick={handleExit}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded font-semibold shadow mr-4"
          >
            BACK TO DASHBOARD
          </button>
          <button
            onClick={() => navigate('/booking')}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded font-semibold shadow"
          >
            BOOK NEW APPOINTMENT
          </button>
        </div>
      </div>

      <footer className="mt-6 text-sm text-gray-400">© 2025 Wits University - Campus Health and Wellness Centre</footer>
    </div>
  );
};

export default MySubmissionsPage;