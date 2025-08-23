import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function RegistrationCapturePage() {
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
      setError("");
      setMessage("");
    } else {
      setFile(null);
      setError("Please upload a valid PDF document.");
    }
  };

  const handleSave = () => {
    if (!file) {
      setError("Please upload a file before saving.");
      return;
    }
    
    setIsLoading(true);
    setError("");
    
    // Get student number from localStorage (set during login)
    const studentNumber = localStorage.getItem('staffNumber');
    
    if (!studentNumber) {
      setError("Student number not found. Please log in again.");
      setIsLoading(false);
      return;
    }
    
    // Convert file to base64 for storage
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = async () => {
      try {
        const base64File = reader.result.split(',')[1]; // Remove data URL prefix
        
        const response = await fetch('http://localhost:5001/api/upload-por', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            studentNumber: studentNumber,
            fileName: file.name,
            fileData: base64File
          }),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || data.details || 'Failed to save file');
        }
        
        setMessage("File saved successfully!");
      } catch (err) {
        setError(err.message || "Failed to save file. Please try again.");
        console.error("Upload error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    reader.onerror = () => {
      setError("Failed to read file. Please try again.");
      setIsLoading(false);
    };
  };

  const handleUpdate = () => {
    setFile(null);
    setError("");
    setMessage("You can now upload a new file.");
    document.getElementById("fileInput").value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setError("You must upload a PDF before continuing.");
      return;
    }
    
    // If file was already saved, just navigate to booking
    if (message === "File saved successfully!") {
      setMessage("File uploaded successfully!");
      setTimeout(() => {
        navigate("/booking");
      }, 1500);
    } else {
      // If not saved yet, save first then navigate
      handleSave();
    }
  };

  return (
    <div style={{ padding: "30px", fontFamily: "Arial", textAlign: "center" }}>
      <h1>Upload Proof of Registration</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="file"
          id="fileInput"
          accept=".pdf"
          onChange={handleFileChange}
          style={{ margin: "10px 0" }}
        />
        {error && <div style={{ color: "red", marginTop: "10px" }}>{error}</div>}
        {message && <div style={{ color: "green", marginTop: "10px" }}>{message}</div>}
        {file && <div style={{ marginTop: "10px" }}>Selected File: {file.name}</div>}

        <div style={{ marginTop: "20px" }}>
          <button
            type="button"
            onClick={handleSave}
            disabled={isLoading}
            style={{
              padding: "10px 20px",
              backgroundColor: isLoading ? "#6c757d" : "#28a745",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              marginRight: "10px",
              cursor: isLoading ? "not-allowed" : "pointer"
            }}
          >
            {isLoading ? "Saving..." : "Save File"}
          </button>

          <button
            type="button"
            onClick={handleUpdate}
            disabled={isLoading}
            style={{
              padding: "10px 20px",
              backgroundColor: "#6c757d",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              marginRight: "10px",
              cursor: isLoading ? "not-allowed" : "pointer"
            }}
          >
            Update File
          </button>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              padding: "10px 20px",
              backgroundColor: "#007bff",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: isLoading ? "not-allowed" : "pointer"
            }}
          >
            Submit & Continue
          </button>
        </div>
      </form>
    </div>
  );
}

export default RegistrationCapturePage;