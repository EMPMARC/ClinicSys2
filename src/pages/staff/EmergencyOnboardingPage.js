import React, { useState } from "react";

const EmergencyOnboardingPage = () => {
  const [formData, setFormData] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Emergency Report Submitted:", formData);
    alert("Emergency report submitted successfully!");
  };

  return (
    <div style={{ padding: "20px", maxWidth: "900px", margin: "auto" }}>
      <h1>Emergency Onboarding</h1>
      <form onSubmit={handleSubmit}>
        {/* EMERGENCY REPORT */}
        <fieldset>
          <legend>Emergency Report</legend>
          <label>Date: <input type="date" name="date" onChange={handleChange} /></label><br />
          <label>Time of Call: <input type="time" name="timeOfCall" onChange={handleChange} /></label><br />
          <label>Person Responsible for Taking the Call: <input type="text" name="personResponsible" onChange={handleChange} /></label><br />
          <label>Name of Person Calling: <input type="text" name="callerName" onChange={handleChange} /></label><br />
          <label>Department: <input type="text" name="department" onChange={handleChange} /></label><br />
          <label>Contact Number: <input type="tel" name="contactNumber" onChange={handleChange} /></label><br />
          <label>Nature of the Problem: <textarea name="problemNature" onChange={handleChange}></textarea></label>
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
          <label>Clinical Staff Member Informed: <input type="text" name="staffInformed" onChange={handleChange} /></label><br />
          <label>Time of Notification: <input type="time" name="notificationTime" onChange={handleChange} /></label><br />
          <label>Clinical Team Responding: <input type="text" name="teamResponding" onChange={handleChange} /></label><br />
          <label>Time Team Left Clinic: <input type="time" name="timeLeftClinic" onChange={handleChange} /></label>
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
          <label>Time of Arrival on Site: <input type="time" name="arrivalTime" onChange={handleChange} /></label>
        </fieldset>

        {/* PATIENT INFORMATION */}
        <fieldset>
          <legend>Patient Information</legend>
          <label>Name: <input type="text" name="patientName" onChange={handleChange} /></label>
          <label>Surname: <input type="text" name="patientSurname" onChange={handleChange} /></label>
        </fieldset>

        {/* PRIMARY ASSESSMENT & INTERVENTION */}
        <fieldset>
          <legend>Primary Assessment</legend>
          <textarea name="primaryAssessment" onChange={handleChange}></textarea>
        </fieldset>
        <fieldset>
          <legend>Intervention</legend>
          <textarea name="intervention" onChange={handleChange}></textarea>
        </fieldset>

        {/* CONSENT */}
        <fieldset>
          <legend>Consent</legend>
          <p>
            I hereby{" "}
            <select name="medicalConsent" onChange={handleChange}>
              <option value="">--Select--</option>
              <option value="give">Give Consent</option>
              <option value="doNotGive">Do Not Give Consent</option>
            </select>{" "}
            to receive medical treatment from CHWC staff.
          </p>
          <p>
            I hereby{" "}
            <select name="transportConsent" onChange={handleChange}>
              <option value="">--Select--</option>
              <option value="consent">Consent</option>
              <option value="doNotConsent">Do Not Consent</option>
            </select>{" "}
            to be transported to CHWC for further assistance.
          </p>
          <label>Signature: <input type="text" name="signature" onChange={handleChange} /></label>
          <label>Date: <input type="date" name="consentDate" onChange={handleChange} /></label>
        </fieldset>

        {/* PATIENT TRANSPORT */}
        <fieldset>
          <legend>Patient Transport</legend>
          <label><input type="checkbox" name="ptCHWCVehicle" onChange={handleChange} /> CHWC Vehicle</label>
          <label><input type="checkbox" name="ptAmbulance" onChange={handleChange} /> Ambulance</label>
          <label><input type="checkbox" name="ptOther" onChange={handleChange} /> Other</label>
          <input type="text" name="ptOtherDetail" placeholder="Please specify" onChange={handleChange} /><br />
          <label>Patient Transported To: <input type="text" name="patientTransportedTo" onChange={handleChange} /></label>
          <label>Time of Departure: <input type="time" name="departureTime" onChange={handleChange} /></label>
        </fieldset>

        {/* CASE MANAGEMENT AT CHWC */}
        <fieldset>
          <legend>Case Management at CHWC</legend>
          <label>Time of Arrival at CHWC: <input type="time" name="chwcArrivalTime" onChange={handleChange} /></label><br />
          <label>Does the patient have an existing file? 
            <input type="radio" name="existingFile" value="yes" onChange={handleChange} /> Yes
            <input type="radio" name="existingFile" value="no" onChange={handleChange} /> No
          </label><br />
          <label>Was the patient referred? 
            <input type="radio" name="referred" value="yes" onChange={handleChange} /> Yes
            <input type="radio" name="referred" value="no" onChange={handleChange} /> No
          </label><br />
          <label>If referred to hospital: <input type="text" name="hospitalName" onChange={handleChange} /></label><br />
          <label>Condition on Discharge: <textarea name="dischargeCondition" onChange={handleChange}></textarea></label><br />
          <label>Time of Discharge: <input type="time" name="dischargeTime" onChange={handleChange} /></label>
        </fieldset>

        <button type="submit" style={{ marginTop: "20px", padding: "10px 20px" }}>Submit Report</button>
      </form>
    </div>
  );
};

export default EmergencyOnboardingPage;