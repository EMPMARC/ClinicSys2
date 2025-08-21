import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function RegistrationCapturePage() {
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
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
    setError("");
    setMessage("File saved successfully (simulated).");
  };

  const handleUpdate = () => {
    setFile(null);
    setError("");
    setMessage("You can now upload a new file.");
    document.getElementById("fileInput").value = "";
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!file) {
      setError("You must upload and save a PDF before continuing.");
      return;
    }

  
    setMessage("File uploaded successfully!");
    setTimeout(() => {
      navigate("/booking");
    }, 1500);
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
        />
        {error && <div style={{ color: "red", marginTop: "10px" }}>{error}</div>}
        {message && <div style={{ color: "green", marginTop: "10px" }}>{message}</div>}
        {file && <div style={{ marginTop: "10px" }}>Selected File: {file.name}</div>}

        <div style={{ marginTop: "20px" }}>
          <button
            type="button"
            onClick={handleSave}
            style={{
              padding: "10px 20px",
              backgroundColor: "#28a745",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              marginRight: "10px",
            }}
          >
            Save File
          </button>

          <button
            type="button"
            onClick={handleUpdate}
            style={{
              padding: "10px 20px",
              backgroundColor: "#6c757d",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              marginRight: "10px",
            }}
          >
            Update File
          </button>

          <button
            type="submit"
            style={{
              padding: "10px 20px",
              backgroundColor: "#007bff",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
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