import React from "react";
import { useNavigate } from "react-router-dom";

const PatientDashboard = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const navigate = useNavigate();

  // Get progress from localStorage (default all)
  const progress = JSON.parse(localStorage.getItem("patientProgress") || "{}");

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    localStorage.removeItem("patientProgress");
    navigate("/");
  };

  const completeStep = (step) => {
    const newProgress = { ...progress, [step]: true };
    localStorage.setItem("patientProgress", JSON.stringify(newProgress));
  };

  const handleClick = (action) => {
    if (action === "upload-proof" && !progress.onboarding) {
      alert("Please complete onboarding first.");
      return;
    }
    if (action === "booking" && !progress.proofUploaded) {
      alert("Please upload and get your proof of registration approved first.");
      return;
    }
    if (action === "health-wellness-booking" && !progress.booking) {
      alert("Please book your first appointment before accessing Health & Wellness Booking.");
      return;
    }
    if (action === "follow-up-booking" && !progress.booking) {
      alert("You must have a previous appointment before making a follow-up booking.");
      return;
    }
    if (action === "my-submissions" && !progress.submission) {
      alert("No submissions found. Please submit something first.");
      return;
    }

    // Simulate marking a step as done (remove this in real version)
    if (action === "onboarding") completeStep("onboarding");
    if (action === "upload-proof") completeStep("proofUploaded");
    if (action === "booking") completeStep("booking");
    if (action === "my-submissions") completeStep("submission");

    navigate("/" + action);
  };

  return (
    <div style={{ padding: 24 }}>
      <h1>Welcome, {user?.name || "Patient"}</h1>
      <p>Choose what you want to do today:</p>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 20 }}>
        <button onClick={() => handleClick("onboarding")}>Start Onboarding</button>
        <button onClick={() => handleClick("upload-proof")}>Upload Proof</button>
        <button onClick={() => handleClick("booking")}>Book New Appointment</button>
        <button onClick={() => handleClick("health-wellness-booking")}>Health & Wellness Booking</button>
        <button onClick={() => handleClick("follow-up-booking")}>Follow-up Booking</button>
        <button onClick={() => handleClick("my-submissions")}>View My Submissions</button>
      </div>

      <div style={{ marginTop: 24 }}>
        <button onClick={logout}>Log out</button>
      </div>
    </div>
  );
};

export default PatientDashboard;