import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const MySubmissionsPage = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const staffNumber = localStorage.getItem('staffNumber');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

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
    if (!dateString) return 'Date not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'Time not set';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  const getStatusBadge = (status, appointmentDate) => {
    let statusConfig;
    
    if (status === 'cancelled') {
      statusConfig = { color: 'bg-red-100 text-red-800', text: 'Cancelled' };
    } else if (status === 'completed') {
      statusConfig = { color: 'bg-green-100 text-green-800', text: 'Completed' };
    } else if (appointmentDate) {
      const today = new Date();
      const appointment = new Date(appointmentDate);
      
      if (appointment.toDateString() === today.toDateString()) {
        statusConfig = { color: 'bg-orange-100 text-orange-800', text: 'Today' };
      } else if (appointment < today) {
        statusConfig = { color: 'bg-gray-100 text-gray-800', text: 'Past' };
      } else {
        statusConfig = { color: 'bg-blue-100 text-blue-800', text: 'Upcoming' };
      }
    } else {
      statusConfig = { color: 'bg-gray-100 text-gray-800', text: 'Scheduled' };
    }
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
        {statusConfig.text}
      </span>
    );
  };

  const getAppointmentTypeIcon = (type) => {
    const icons = {
      'General Consultation': '🩺',
      'Mental Health': '🧠',
      'Health & Wellness': '💪',
      'Follow-Up': '↩️',
      'default': '📅'
    };
    
    return icons[type] || icons['default'];
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
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-3xl font-bold text-blue-900">My Appointments & Submissions</h2>
            <button
              onClick={handleExit}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold"
            >
              BACK TO DASHBOARD
            </button>
          </div>
          <p className="text-gray-700">
            Welcome, {user?.name || 'Patient'}. Here are all your scheduled appointments and submissions with the Campus Health and Wellness Centre.
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <div className="text-2xl font-bold text-blue-600">{appointments.length}</div>
            <div className="text-sm text-gray-600">Total Appointments</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <div className="text-2xl font-bold text-green-600">
              {appointments.filter(a => a.status === 'completed' || (a.appointment_date && new Date(a.appointment_date) < new Date())).length}
            </div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <div className="text-2xl font-bold text-orange-600">
              {appointments.filter(a => 
                a.status === 'scheduled' && 
                a.appointment_date && 
                new Date(a.appointment_date).toDateString() === new Date().toDateString()
              ).length}
            </div>
            <div className="text-sm text-gray-600">Today</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <div className="text-2xl font-bold text-blue-600">
              {appointments.filter(a => 
                a.status === 'scheduled' && 
                a.appointment_date && 
                new Date(a.appointment_date) > new Date()
              ).length}
            </div>
            <div className="text-sm text-gray-600">Upcoming</div>
          </div>
        </div>

        {appointments.length > 0 ? (
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Appointment</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {appointments.map((appointment) => (
                    <tr key={appointment.id} className="hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className="flex items-center">
                          <span className="text-2xl mr-3">{getAppointmentTypeIcon(appointment.appointment_for)}</span>
                          <div>
                            <div className="font-medium text-gray-900">{appointment.appointment_for}</div>
                            <div className="text-sm text-gray-500">{appointment.appointment_type}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm text-gray-900">Booked by: {appointment.full_name}</div>
                        <div className="text-sm text-gray-500">Staff #: {appointment.staff_number}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm font-medium text-gray-900">{formatDate(appointment.appointment_date)}</div>
                        <div className="text-sm text-gray-500">{formatTime(appointment.appointment_time)}</div>
                      </td>
                      <td className="py-4 px-4">
                        {getStatusBadge(appointment.status, appointment.appointment_date)}
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-mono text-blue-600 text-sm">{appointment.reference_number}</span>
                        <div className="text-xs text-gray-500 mt-1">
                          Created: {new Date(appointment.created_at).toLocaleDateString()}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow-lg rounded-lg p-8 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
            </div>
            <p className="text-gray-500 text-lg mb-2">You don't have any appointments yet.</p>
            <p className="text-gray-400 mb-6">Book your first appointment to get started with our services.</p>
            <button
              onClick={() => navigate('/booking')}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded font-semibold shadow"
            >
              BOOK YOUR FIRST APPOINTMENT
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="text-center mt-8 space-x-4">
          <button
            onClick={handleExit}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded font-semibold shadow"
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

        <footer className="mt-6 text-sm text-gray-400 text-center">
          © 2025 Wits University - Campus Health and Wellness Centre
        </footer>
      </div>
    </div>
  );
};

export default MySubmissionsPage;