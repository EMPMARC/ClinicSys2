import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Remove unused 'useLocation' import

const RegistrationCapturePage = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  // Remove unused 'location' variable
  const navigate = useNavigate();
  
  // Get student number from localStorage (set during login)
  const studentNumber = localStorage.getItem('studentNumber');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setUploadStatus('');
    } else {
      setUploadStatus('Please select a PDF file');
    }
  };

  const handleUpload = () => {
    if (!selectedFile) {
      setUploadStatus('Please select a file first');
      return;
    }

    if (!studentNumber) {
      setUploadStatus('Student number not found. Please login again.');
      navigate('/');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const fileData = e.target.result.split(',')[1]; // Get base64 data

      fetch('http://localhost:5001/api/upload-por', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentNumber: studentNumber,
          fileName: selectedFile.name,
          fileData: fileData
        }),
      })
      .then(response => response.json())
      .then(data => {
        if (data.message) {
          setUploadStatus('File uploaded successfully!');
          setSelectedFile(null);
          
          // Mark proof as uploaded in progress
          const progress = JSON.parse(localStorage.getItem("patientProgress") || "{}");
          localStorage.setItem("patientProgress", JSON.stringify({
            ...progress,
            proofUploaded: true
          }));
        } else {
          setUploadStatus('Error: ' + data.error);
        }
      })
      .catch(error => {
        setUploadStatus('Error uploading file: ' + error.message);
      });
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleBackToDashboard = () => {
    navigate('/patient-dashboard');
  };

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
      <h2>Upload Proof of Registration</h2>
      <p><strong>Student Number:</strong> {studentNumber}</p>
      
      <div style={{ marginBottom: '15px' }}>
        <input 
          type="file" 
          accept=".pdf" 
          onChange={handleFileChange} 
          style={{ marginBottom: '10px' }}
        />
      </div>
      
      <button 
        onClick={handleUpload} 
        disabled={!selectedFile}
        style={{
          padding: '10px 20px',
          backgroundColor: !selectedFile ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: !selectedFile ? 'not-allowed' : 'pointer',
          marginRight: '10px'
        }}
      >
        Upload Document
      </button>
      
      <button 
        onClick={handleBackToDashboard}
        style={{
          padding: '10px 20px',
          backgroundColor: '#6c757d',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Back to Dashboard
      </button>
      
      {uploadStatus && (
        <div style={{ 
          marginTop: '15px', 
          padding: '10px', 
          backgroundColor: uploadStatus.includes('Error') ? '#f8d7da' : '#d4edda',
          color: uploadStatus.includes('Error') ? '#721c24' : '#155724',
          borderRadius: '4px'
        }}>
          {uploadStatus}
        </div>
      )}
    </div>
  );
};

export default RegistrationCapturePage;