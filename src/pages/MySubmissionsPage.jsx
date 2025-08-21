import React from 'react';
import { useNavigate } from 'react-router-dom';

const MySubmissionsPage = () => {
  const navigate = useNavigate();

  const validSubmissions = [
    { id: 'CHWCS9299101975', detailsUrl: '/appointments/CHWCS9299101975' },
    { id: 'CHWCS7361204643', detailsUrl: '/appointments/CHWCS7361204643' },
    { id: 'CHWCS1018443315', detailsUrl: '/appointments/CHWCS1018443315' },
  ];

  const handleExit = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-xl">
        <h2 className="text-3xl font-bold text-blue-900 mb-4">My Submissions</h2>
        <p className="text-gray-700 mb-6">
          Below is a summary of your previous submissions and bookings:
        </p>

        <ul className="divide-y border rounded">
          {validSubmissions.length > 0 ? (
            validSubmissions.map((submission) => (
              <li key={submission.id} className="py-4 px-3 hover:bg-gray-100">
                <a
                  href={submission.detailsUrl}
                  className="text-blue-600 hover:underline"
                >
                  {submission.id}
                </a>
              </li>
            ))
          ) : (
            <li className="py-4 px-3 text-gray-500">No submissions found.</li>
          )}
        </ul>

        <div className="text-center mt-8">
          <button
            onClick={handleExit}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded font-semibold shadow"
          >
            EXIT
          </button>
        </div>
      </div>

      <footer className="mt-6 text-sm text-gray-400">© 2025 Wits</footer>
    </div>
  );
};

export default MySubmissionsPage;