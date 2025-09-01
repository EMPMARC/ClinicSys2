import React, { useState } from "react";

const EmergencyOnboardingPage = () => {
  const [formData, setFormData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage("");

    // Validate required fields
    const requiredFields = [
      'date', 'timeOfCall', 'personResponsible', 'callerName', 'department',
      'contactNumber', 'problemNature', 'staffInformed', 'notificationTime',
      'teamResponding', 'timeLeftClinic', 'arrivalTime', 'studentNumber',
      'patientName', 'patientSurname', 'primaryAssessment', 'intervention',
      'medicalConsent', 'transportConsent', 'signature', 'consentDate',
      'patientTransportedTo', 'departureTime', 'chwcArrivalTime',
      'existingFile', 'referred', 'dischargeCondition', 'dischargeTime'
    ];

    const missingFields = requiredFields.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
      setSubmitMessage(`Error: Missing required fields: ${missingFields.join(', ')}`);
      setIsSubmitting(false);
      return;
    }

    try {
      // Prepare the data for submission
      const submissionData = {
        date: formData.date,
        timeOfCall: formData.timeOfCall,
        personResponsible: formData.personResponsible,
        callerName: formData.callerName,
        department: formData.department,
        contactNumber: formData.contactNumber,
        problemNature: formData.problemNature,
        
        // Location of Emergency
        eastCampus: formData.eastCampus || false,
        westCampus: formData.westCampus || false,
        educationCampus: formData.educationCampus || false,
        otherCampus: formData.otherCampus || false,
        building: formData.building,
        roomNumber: formData.roomNumber,
        floor: formData.floor,
        otherLocation: formData.otherLocation,
        
        // Hand Over
        staffInformed: formData.staffInformed,
        notificationTime: formData.notificationTime,
        teamResponding: formData.teamResponding,
        timeLeftClinic: formData.timeLeftClinic,
        
        // Responding Team Transport
        chwcVehicle: formData.chwcVehicle || false,
        sistersOnFoot: formData.sistersOnFoot || false,
        otherTransport: formData.otherTransport || false,
        otherTransportDetail: formData.otherTransportDetail,
        
        // On Site Emergency Management
        arrivalTime: formData.arrivalTime,
        
        // Patient Information
        studentNumber: formData.studentNumber,
        patientName: formData.patientName,
        patientSurname: formData.patientSurname,
        
        // Primary Assessment & Intervention
        primaryAssessment: formData.primaryAssessment,
        intervention: formData.intervention,
        
        // Consent
        medicalConsent: formData.medicalConsent,
        transportConsent: formData.transportConsent,
        signature: formData.signature,
        consentDate: formData.consentDate,
        
        // Patient Transport
        ptCHWCVehicle: formData.ptCHWCVehicle || false,
        ptAmbulance: formData.ptAmbulance || false,
        ptOther: formData.ptOther || false,
        ptOtherDetail: formData.ptOtherDetail,
        patientTransportedTo: formData.patientTransportedTo,
        departureTime: formData.departureTime,
        
        // Case Management at CHWC
        chwcArrivalTime: formData.chwcArrivalTime,
        existingFile: formData.existingFile,
        referred: formData.referred,
        hospitalName: formData.hospitalName,
        dischargeCondition: formData.dischargeCondition,
        dischargeTime: formData.dischargeTime
      };

      const response = await fetch('http://localhost:5001/api/emergency-onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      });

      const result = await response.json();

      if (response.ok) {
        console.log("Emergency Report Submitted:", result);
        setSubmitMessage("Emergency report submitted successfully!");
        alert("Emergency report submitted successfully!");
        
        // Optionally reset the form
        setFormData({});
      } else {
        console.error("Submission error:", result);
        setSubmitMessage(`Error: ${result.error} - ${result.details || ''}`);
        alert(`Error: ${result.error}\n${result.details || ''}`);
      }
    } catch (error) {
      console.error("Network error:", error);
      setSubmitMessage("Network error. Please check your connection and try again.");
      alert("Network error. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "900px", margin: "auto" }}>
      <h1>Emergency Onboarding</h1>
      
      {submitMessage && (
        <div style={{
          padding: "10px",
          margin: "10px 0",
          backgroundColor: submitMessage.includes("Error") ? "#ffebee" : "#e8f5e8",
          border: submitMessage.includes("Error") ? "1px solid #f44336" : "1px solid #4caf50",
          color: submitMessage.includes("Error") ? "#d32f2f" : "#2e7d32",
          borderRadius: "4px"
        }}>
          {submitMessage}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        {/* EMERGENCY REPORT */}
        <fieldset>
          <legend>Emergency Report</legend>
          <label>Date: <input type="date" name="date" onChange={handleChange} required /></label><br />
          <label>Time of Call: <input type="time" name="timeOfCall" onChange={handleChange} required /></label><br />
          <label>Person Responsible for Taking the Call: <input type="text" name="personResponsible" onChange={handleChange} required /></label><br />
          <label>Name of Person Calling: <input type="text" name="callerName" onChange={handleChange} required /></label><br />
          <label>Department: <input type="text" name="department" onChange={handleChange} required /></label><br />
          <label>Contact Number: <input type="tel" name="contactNumber" onChange={handleChange} required /></label><br />
          <label>Nature of the Problem: <textarea name="problemNature" onChange={handleChange} required></textarea></label>
        </fieldset>

        {/* LOCATION OF EMERGENCY */}
        <fieldset>
          <legend>Location of Emergency</legend>
          <label><input type="checkbox" name="eastCampus" onChange={handleChange} /> East Campus</label>
          <label><input type="checkbox" name="westCampus" onChange={handleChange} /> West Campus</label>
          <label><input type="checkbox" name="educationCampus" onChange={handleChange} /> Education Campus</label>
          <label><input type="checkbox" name="otherCampus" onChange={handleChange} /> Other</label><br />
          <label>Building: <input type="text" name="building" onChange={handleChange} /></label>
          <label>Room Number: <input type="text" name="roomNumber" onChange={handleChange} /></label>
          <label>Floor: <input type="text" name="floor" onChange={handleChange} /></label>
          <label>Other: <input type="text" name="otherLocation" onChange={handleChange} /></label>
        </fieldset>

        {/* HAND OVER */}
        <fieldset>
          <legend>Hand Over</legend>
          <label>Clinical Staff Member Informed: <input type="text" name="staffInformed" onChange={handleChange} required /></label><br />
          <label>Time of Notification: <input type="time" name="notificationTime" onChange={handleChange} required /></label><br />
          <label>Clinical Team Responding: <input type="text" name="teamResponding" onChange={handleChange} required /></label><br />
          <label>Time Team Left Clinic: <input type="time" name="timeLeftClinic" onChange={handleChange} required /></label>
        </fieldset>

        {/* RESPONDING TEAM TRANSPORT */}
        <fieldset>
          <legend>Responding Team Transport</legend>
          <label><input type="checkbox" name="chwcVehicle" onChange={handleChange} /> CHWC Vehicle</label>
          <label><input type="checkbox" name="sistersOnFoot" onChange={handleChange} /> Sisters on Foot</label>
          <label><input type="checkbox" name="otherTransport" onChange={handleChange} /> Other</label>
          <input type="text" name="otherTransportDetail" placeholder="Please specify" onChange={handleChange} />
        </fieldset>

        {/* ON SITE EMERGENCY MANAGEMENT */}
        <fieldset>
          <legend>On Site Emergency Management</legend>
          <label>Time of Arrival on Site: <input type="time" name="arrivalTime" onChange={handleChange} required /></label>
        </fieldset>

        {/* PATIENT INFORMATION */}
        <fieldset>
          <legend>Patient Information</legend>
          <label>Student Number: <input type="text" name="studentNumber" onChange={handleChange} required /></label><br />
          <label>Name: <input type="text" name="patientName" onChange={handleChange} required /></label>
          <label>Surname: <input type="text" name="patientSurname" onChange={handleChange} required /></label>
        </fieldset>

        {/* PRIMARY ASSESSMENT & INTERVENTION */}
        <fieldset>
          <legend>Primary Assessment</legend>
          <textarea name="primaryAssessment" onChange={handleChange} required></textarea>
        </fieldset>
        <fieldset>
          <legend>Intervention</legend>
          <textarea name="intervention" onChange={handleChange} required></textarea>
        </fieldset>

        {/* CONSENT */}
        <fieldset>
          <legend>Consent</legend>
          <p>
            I hereby{" "}
            <select name="medicalConsent" onChange={handleChange} required>
              <option value="">--Select--</option>
              <option value="give">Give Consent</option>
              <option value="doNotGive">Do Not Give Consent</option>
            </select>{" "}
            to receive medical treatment from CHWC staff.
          </p>
          <p>
            I hereby{" "}
            <select name="transportConsent" onChange={handleChange} required>
              <option value="">--Select--</option>
              <option value="consent">Consent</option>
              <option value="doNotConsent">Do Not Consent</option>
            </select>{" "}
            to be transported to CHWC for further assistance.
          </p>
          <label>Signature: <input type="text" name="signature" onChange={handleChange} required /></label>
          <label>Date: <input type="date" name="consentDate" onChange={handleChange} required /></label>
        </fieldset>

        {/* PATIENT TRANSPORT */}
        <fieldset>
          <legend>Patient Transport</legend>
          <label><input type="checkbox" name="ptCHWCVehicle" onChange={handleChange} /> CHWC Vehicle</label>
          <label><input type="checkbox" name="ptAmbulance" onChange={handleChange} /> Ambulance</label>
          <label><input type="checkbox" name="ptOther" onChange={handleChange} /> Other</label>
          <input type="text" name="ptOtherDetail" placeholder="Please specify" onChange={handleChange} /><br />
          <label>Patient Transported To: <input type="text" name="patientTransportedTo" onChange={handleChange} required /></label>
          <label>Time of Departure: <input type="time" name="departureTime" onChange={handleChange} required /></label>
        </fieldset>

        {/* CASE MANAGEMENT AT CHWC */}
        <fieldset>
          <legend>Case Management at CHWC</legend>
          <label>Time of Arrival at CHWC: <input type="time" name="chwcArrivalTime" onChange={handleChange} required /></label><br />
          <label>Does the patient have an existing file? 
            <input type="radio" name="existingFile" value="yes" onChange={handleChange} required /> Yes
            <input type="radio" name="existingFile" value="no" onChange={handleChange} required /> No
          </label><br />
          <label>Was the patient referred? 
            <input type="radio" name="referred" value="yes" onChange={handleChange} required /> Yes
            <input type="radio" name="referred" value="no" onChange={handleChange} required /> No
          </label><br />
          <label>If referred to hospital: <input type="text" name="hospitalName" onChange={handleChange} /></label><br />
          <label>Condition on Discharge: <textarea name="dischargeCondition" onChange={handleChange} required></textarea></label><br />
          <label>Time of Discharge: <input type="time" name="dischargeTime" onChange={handleChange} required /></label>
        </fieldset>

        <button 
          type="submit" 
          style={{ marginTop: "20px", padding: "10px 20px" }}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Submitting..." : "Submit Report"}
        </button>
      </form>
    </div>
  );
};

export default EmergencyOnboardingPage;