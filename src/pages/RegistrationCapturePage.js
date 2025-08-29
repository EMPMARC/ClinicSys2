import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const RegistrationCapturePage = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const navigate = useNavigate();
  
  const studentNumber = localStorage.getItem('studentNumber');

  // Wrap fetchUploadedFiles with useCallback to memoize it
  const fetchUploadedFiles = useCallback(async () => {
    try {
      const response = await fetch(`http://localhost:5001/api/student-files/${studentNumber}`);
      const data = await response.json();
      
      if (data.files) {
        setUploadedFiles(data.files);
      }
    } catch (error) {
      console.error('Error fetching uploaded files:', error);
    }
  }, [studentNumber]); // Add studentNumber as dependency

  useEffect(() => {
    if (studentNumber) {
      fetchUploadedFiles();
    }
  }, [studentNumber, fetchUploadedFiles]); // Now includes fetchUploadedFiles in dependencies

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
      
      if (!allowedTypes.includes(file.type)) {
        setUploadStatus('Please select a valid file type (PDF, Word, Image, Text)');
        return;
      }
      
      // Check file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        setUploadStatus('File size must be less than 10MB');
        return;
      }
      
      setSelectedFile(file);
      setUploadStatus('');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadStatus('Please select a file first');
      return;
    }

    if (!studentNumber) {
      setUploadStatus('Student number not found. Please login again.');
      navigate('/');
      return;
    }

    setIsUploading(true);
    setUploadStatus('Uploading...');

    const formData = new FormData();
    formData.append('document', selectedFile);
    formData.append('studentNumber', studentNumber);

    try {
      const response = await fetch('http://localhost:5001/api/upload-por-multer', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (response.ok) {
        setUploadStatus('File uploaded successfully!');
        setSelectedFile(null);
        
        // Clear file input
        document.getElementById('file-input').value = '';
        
        // Mark proof as uploaded in progress
        const progress = JSON.parse(localStorage.getItem("patientProgress") || "{}");
        const updatedProgress = {
          ...progress,
          proofUploaded: true
        };
        localStorage.setItem("patientProgress", JSON.stringify(updatedProgress));
        
        // Refresh uploaded files list
        fetchUploadedFiles();
      } else {
        setUploadStatus('Error: ' + (data.error || 'Upload failed'));
      }
    } catch (error) {
      setUploadStatus('Error uploading file: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (fileId, fileName) => {
    try {
      const response = await fetch(`http://localhost:5001/api/download-file/${fileId}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } else {
        const errorData = await response.json();
        setUploadStatus('Download failed: ' + (errorData.error || 'Unknown error'));
      }
    } catch (error) {
      setUploadStatus('Download error: ' + error.message);
    }
  };

  const handleBackToDashboard = () => {
    navigate('/patient-dashboard');
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>Upload Proof of Registration</h2>
      <p><strong>Student Number:</strong> {studentNumber}</p>
      
      <div style={{ 
        border: '2px dashed #007bff', 
        padding: '20px', 
        borderRadius: '8px', 
        marginBottom: '20px',
        textAlign: 'center'
      }}>
        <input 
          id="file-input"
          type="file" 
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
          onChange={handleFileChange} 
          style={{ marginBottom: '10px' }}
          disabled={isUploading}
        />
        
        {selectedFile && (
          <div style={{ 
            backgroundColor: '#e8f4fd', 
            padding: '10px', 
            borderRadius: '4px', 
            marginTop: '10px',
            borderLeft: '4px solid #2196f3'
          }}>
            <p><strong>Selected File:</strong> {selectedFile.name}</p>
            <p><strong>Size:</strong> {formatFileSize(selectedFile.size)}</p>
            <p><strong>Type:</strong> {selectedFile.type}</p>
          </div>
        )}
      </div>
      
      <button 
        onClick={handleUpload} 
        disabled={!selectedFile || isUploading}
        style={{
          padding: '10px 20px',
          backgroundColor: !selectedFile || isUploading ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: !selectedFile || isUploading ? 'not-allowed' : 'pointer',
          marginRight: '10px',
          marginBottom: '20px'
        }}
      >
        {isUploading ? 'Uploading...' : 'Upload Document'}
      </button>
      
      <button 
        onClick={handleBackToDashboard}
        style={{
          padding: '10px 20px',
          backgroundColor: '#6c757d',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          marginBottom: '20px'
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
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          {uploadStatus}
        </div>
      )}
      
      {/* Uploaded Files Section */}
      {uploadedFiles.length > 0 && (
        <div style={{ marginTop: '30px' }}>
          <h3>Your Uploaded Files</h3>
          <div style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '15px' }}>
            {uploadedFiles.map((file) => (
              <div key={file.id} style={{ 
                padding: '10px', 
                borderBottom: '1px solid #eee',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <strong>{file.file_name}</strong>
                  <br />
                  <small>
                    Size: {formatFileSize(file.file_size)} | 
                    Type: {file.mimetype} | 
                    Uploaded: {new Date(file.uploaded_at).toLocaleDateString()}
                  </small>
                </div>
                <button
                  onClick={() => handleDownload(file.id, file.file_name)}
                  style={{
                    padding: '5px 10px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Download
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistrationCapturePage;