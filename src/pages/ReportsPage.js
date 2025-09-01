import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import NewRegistrationsReport from './NewRegistrationsReport';

const ReportsPage = () => {
  const [loading, setLoading] = useState({});
  const [error, setError] = useState({});
  const [success, setSuccess] = useState({});
  const [activeReport, setActiveReport] = useState(null);
  const navigate = useNavigate();

  const generateReport = async (reportType) => {
    setLoading(prev => ({ ...prev, [reportType]: true }));
    setError(prev => ({ ...prev, [reportType]: '' }));
    setSuccess(prev => ({ ...prev, [reportType]: '' }));

    try {
      const response = await axios.post(`http://localhost:5001/api/${reportType}`, {}, {
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Set filename based on report type
      let filename = 'report.pdf';
      switch(reportType) {
        case 'report1':
          filename = 'appointments_report.pdf';
          break;
        case 'report2':
          filename = 'emergency_report.pdf';
          break;
        case 'report3':
          filename = 'por_report.pdf';
          break;
        default:
          filename = 'report.pdf';
          break;
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      setSuccess(prev => ({ ...prev, [reportType]: 'Report generated successfully!' }));
    } catch (err) {
      setError(prev => ({ ...prev, [reportType]: 'Error generating report. Please try again.' }));
      console.error('Error generating report:', err);
    } finally {
      setLoading(prev => ({ ...prev, [reportType]: false }));
    }
  };

  const viewNewRegistrationsReport = () => {
    setActiveReport('newRegistrations');
  };

  const backToReportsList = () => {
    setActiveReport(null);
  };

  const containerStyle = {
    fontFamily: 'Arial, sans-serif',
    backgroundColor: '#f5f7fa',
    minHeight: '100vh',
    padding: '20px',
  };

  const headerStyle = {
    backgroundColor: '#4a4a4a',
    color: 'white',
    padding: '15px 20px',
    borderRadius: '8px',
    textAlign: 'center',
    marginBottom: '30px',
  };

  const reportsGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
    marginBottom: '30px',
  };

  const reportCardStyle = {
    backgroundColor: 'white',
    borderRadius: '10px',
    padding: '25px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    border: '2px solid #e9ecef',
    transition: 'all 0.3s ease',
  };

  const reportTitleStyle = {
    fontSize: '1.3em',
    fontWeight: 'bold',
    marginBottom: '10px',
    color: '#333',
  };

  const reportDescriptionStyle = {
    color: '#666',
    marginBottom: '20px',
    lineHeight: '1.5',
  };

  const buttonStyle = {
    padding: '12px 20px',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    cursor: 'pointer',
    backgroundColor: '#007bff',
    color: 'white',
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
    transition: '0.3s',
    width: '100%',
  };

  const backButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#6c757d',
    maxWidth: '200px',
    margin: '0 auto',
    display: 'block',
  };

  const loadingStyle = {
    color: '#007bff',
    fontStyle: 'italic',
    marginTop: '10px',
    textAlign: 'center',
  };

  const errorStyle = {
    color: '#dc3545',
    marginTop: '10px',
    textAlign: 'center',
    fontSize: '0.9em',
  };

  const successStyle = {
    color: '#28a745',
    marginTop: '10px',
    textAlign: 'center',
    fontSize: '0.9em',
  };

  return (
    <div style={containerStyle}>
      {activeReport === 'newRegistrations' ? (
        // New Registrations Report View
        <div>
          <div style={headerStyle}>
            <h1>📊 New Student Onboarding Report</h1>
            <p>Interactive report showing new student registrations who completed the onboarding process</p>
          </div>
          <NewRegistrationsReport />
          <button style={backButtonStyle} onClick={backToReportsList}>
            ← Back to Reports List
          </button>
        </div>
      ) : (
        // Main Reports Dashboard
        <>
          {/* Header */}
          <div style={headerStyle}>
            <h1>📊 CHWC Reports Dashboard</h1>
            <p>Generate comprehensive reports for your campus health system</p>
          </div>

          {/* Reports Grid */}
          <div style={reportsGridStyle}>
            {/* Appointments Report */}
            <div style={reportCardStyle}>
              <div style={reportTitleStyle}>📅 Appointments Report</div>
              <div style={reportDescriptionStyle}>
                Monthly breakdown of appointments and emergency cases with detailed statistics and trends.
              </div>
              <button 
                style={buttonStyle} 
                onClick={() => generateReport('report1')}
                disabled={loading.report1}
              >
                {loading.report1 ? 'Generating...' : 'Generate Report'}
              </button>
              {loading.report1 && <div style={loadingStyle}>Generating report...</div>}
              {error.report1 && <div style={errorStyle}>{error.report1}</div>}
              {success.report1 && <div style={successStyle}>{success.report1}</div>}
            </div>

            {/* Emergency Report */}
            <div style={reportCardStyle}>
              <div style={reportTitleStyle}>🚨 Emergency Report</div>
              <div style={reportDescriptionStyle}>
                Campus-wise emergency statistics showing distribution across Parktown and Main campuses.
              </div>
              <button 
                style={buttonStyle} 
                onClick={() => generateReport('report2')}
                disabled={loading.report2}
              >
                {loading.report2 ? 'Generating...' : 'Generate Report'}
              </button>
              {loading.report2 && <div style={loadingStyle}>Generating report...</div>}
              {error.report2 && <div style={errorStyle}>{error.report2}</div>}
              {success.report2 && <div style={successStyle}>{success.report2}</div>}
            </div>

            {/* POR Report */}
            <div style={reportCardStyle}>
              <div style={reportTitleStyle}>📋 Proof of Registration Report</div>
              <div style={reportDescriptionStyle}>
                Monthly upload statistics for proof of registration documents submitted by students.
              </div>
              <button 
                style={buttonStyle} 
                onClick={() => generateReport('report3')}
                disabled={loading.report3}
              >
                {loading.report3 ? 'Generating...' : 'Generate Report'}
              </button>
              {loading.report3 && <div style={loadingStyle}>Generating report...</div>}
              {error.report3 && <div style={errorStyle}>{error.report3}</div>}
              {success.report3 && <div style={successStyle}>{success.report3}</div>}
            </div>

            {/* New Registrations Report */}
            <div style={reportCardStyle}>
              <div style={reportTitleStyle}>👥 New Student Onboarding Report</div>
              <div style={reportDescriptionStyle}>
                Interactive dashboard showing new student registrations who completed the onboarding process with charts, filters, and detailed breakdowns.
              </div>
              <button 
                style={buttonStyle} 
                onClick={viewNewRegistrationsReport}
              >
                View Report
              </button>
            </div>
          </div>

          {/* Back Button */}
          <button style={backButtonStyle} onClick={() => navigate('/admin-dashboard')}>
            ← Back to Dashboard
          </button>
        </>
      )}
    </div>
  );
};

export default ReportsPage;
