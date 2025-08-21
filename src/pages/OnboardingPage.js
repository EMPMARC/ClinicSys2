import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";


const EightDigitDateInput = ({ label, name, value, onChange }) => {
  const handleChange = (e, index) => {
    const newValue = value.split('');
    newValue[index] = e.target.value.replace(/[^0-9]/g, '').slice(-1);
    onChange((prev) => ({
      ...prev,
      [name]: newValue.join(''),
    }));
  };

  const placeholders = ['D', 'D', 'M', 'M', 'Y', 'Y', 'Y', 'Y'];

  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{ fontWeight: 'bold', marginRight: '8px' }}>{label}</label>
      <div style={{ display: 'inline-flex', gap: '4px' }}>
        {Array.from({ length: 8 }).map((_, index) => (
          <input
            key={index}
            type="text"
            maxLength={1}
            value={value[index] || ''}
            placeholder={placeholders[index]}
            onChange={(e) => handleChange(e, index)}
            style={{
              width: '24px',
              height: '28px',
              textAlign: 'center',
              fontSize: '14px',
              border: '1px solid #ccc',
              borderRadius: '4px',
            }}
          />
        ))}
      </div>
    </div>
  );
};

function OnboardingPage() {
  const [formData, setFormData] = useState({
    studentNumber: "",
    surname: "",
    fullNames: "",
    dateOfBirth: "",
    gender: "",
    otherGender: "",
    physicalAddress: "",
    postalAddress: "",
    code: "",
    email: "",
    cell: "",
    altNumber: "",
    emergencyName: "",
    emergencyRelation: "",
    emergencyWorkTel: "",
    emergencyCell: "",
    medicalConditions: "",
    operations: "",
    conditionsDetails: "",
    disability: "",
    disabilityDetails: "",
    medication: "",
    medicationDetails: "",
    otherConditions: "",
    congenital: "",
    familyOther: "",
    smoking: "",
    recreation: "",
    psychological: "",
    psychologicalDetails: "",
    date: "",
  });

  const signatureRef = useRef(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleClearSignature = () => {
    const canvas = signatureRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleMouseDown = (e) => {
    const canvas = signatureRef.current;
    const ctx = canvas.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    canvas.isDrawing = true;
  };

  const handleMouseMove = (e) => {
    const canvas = signatureRef.current;
    if (!canvas.isDrawing) return;
    const ctx = canvas.getContext("2d");
    ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    ctx.stroke();
  };

  const handleMouseUp = () => {
    signatureRef.current.isDrawing = false;
  };

  const handleTouchStart = (e) => {
    e.preventDefault();
    const canvas = signatureRef.current;
    const ctx = canvas.getContext("2d");
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top);
    canvas.isDrawing = true;
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    const canvas = signatureRef.current;
    if (!canvas.isDrawing) return;
    const ctx = canvas.getContext("2d");
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top);
    ctx.stroke();
  };

  const handleTouchEnd = () => {
    signatureRef.current.isDrawing = false;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form submitted", formData);
    navigate("/upload-proof");
  };

  const renderRadio = (name, options) =>
    options.map((opt) => (
      <label key={opt} style={{ marginRight: '10px' }}>
        <input
          type="radio"
          name={name}
          value={opt}
          checked={formData[name] === opt}
          onChange={handleChange}
          required
        />
        {opt}
      </label>
    ));

  return (
    <div style={{ padding: "30px", fontFamily: "Arial" }}>
      <h1 style={{ textAlign: "center" }}>Campus Health & Wellness Centre</h1>
      <h2 style={{ textAlign: "center" }}>University of the Witwatersrand</h2>
      <h3 style={{ textAlign: "center", textDecoration: "underline" }}>
        CONFIDENTIAL MEDICAL HISTORY: STUDENT
      </h3>

      <form onSubmit={handleSubmit} style={{ maxWidth: "800px", margin: "0 auto" }}>
        <hr />
        <EightDigitDateInput label="Date:" name="date" value={formData.date} onChange={setFormData} />

        <div>
          <label>Student Number:</label>
          <input name="studentNumber" value={formData.studentNumber} onChange={handleChange} required />
        </div>
        <div>
          <label>Surname:</label>
          <input name="surname" value={formData.surname} onChange={handleChange} required />
        </div>
        <div>
          <label>Full Names:</label>
          <input name="fullNames" value={formData.fullNames} onChange={handleChange} required />
        </div>

        <EightDigitDateInput label="Date of Birth:" name="dateOfBirth" value={formData.dateOfBirth} onChange={setFormData} />

        <div>
          <label>Gender:</label>
          {renderRadio("gender", ["Male", "Female", "Other"])}
          {formData.gender === "Other" && (
            <input
              name="otherGender"
              placeholder="Please specify"
              value={formData.otherGender}
              onChange={handleChange}
            />
          )}
        </div>

        <hr />
        <h4 style={{ fontWeight: "bold", textDecoration: "underline" }}>Contact Details</h4>
        <div>
          <label>Physical Address:</label>
          <input name="physicalAddress" value={formData.physicalAddress} onChange={handleChange} required />
        </div>
        <div>
          <label>Postal Address:</label>
          <input name="postalAddress" value={formData.postalAddress} onChange={handleChange} required />
        </div>
        <div>
          <label>Code:</label>
          <input name="code" value={formData.code} onChange={handleChange} required />
        </div>
        <div>
          <label>Email:</label>
          <input name="email" type="email" value={formData.email} onChange={handleChange} required />
        </div>
        <div>
          <label>Cell:</label>
          <input name="cell" value={formData.cell} onChange={handleChange} required />
        </div>
        <div>
          <label>Alternative Number:</label>
          <input name="altNumber" value={formData.altNumber} onChange={handleChange} />
        </div>

        <hr />
        <h4 style={{ fontWeight: "bold", textDecoration: "underline" }}>
          Friend/Relative to be contacted in an emergency
        </h4>
        <div>
          <label>Name:</label>
          <input name="emergencyName" value={formData.emergencyName} onChange={handleChange} required />
        </div>
        <div>
          <label>Relationship:</label>
          <input name="emergencyRelation" value={formData.emergencyRelation} onChange={handleChange} required />
        </div>
        <div>
          <label>Work Tel:</label>
          <input name="emergencyWorkTel" value={formData.emergencyWorkTel} onChange={handleChange} />
        </div>
        <div>
          <label>Cell No:</label>
          <input name="emergencyCell" value={formData.emergencyCell} onChange={handleChange} required />
        </div>

        <hr />
        <h4 style={{ fontWeight: "bold", textDecoration: "underline" }}>
          Please indicate if you have a history of the following conditions
        </h4>
        <div>
          <label>Any Medical Conditions:</label>
          {renderRadio("medicalConditions", ["Yes", "No"])}
        </div>
        <div>
          <label>Any Operations/Surgery:</label>
          {renderRadio("operations", ["Yes", "No"])}
        </div>
        <div>
          <label>If yes to any of the above, please specify:</label>
          <textarea name="conditionsDetails" value={formData.conditionsDetails} onChange={handleChange} />
        </div>
        <div>
          <label>Do you have any disabilities?</label>
          {renderRadio("disability", ["Yes", "No"])}
          <input
            name="disabilityDetails"
            placeholder="Please specify"
            value={formData.disabilityDetails}
            onChange={handleChange}
          />
        </div>
        <div>
          <label>Are you on medication?</label>
          {renderRadio("medication", ["Yes", "No"])}
          <input
            name="medicationDetails"
            placeholder="Please specify"
            value={formData.medicationDetails}
            onChange={handleChange}
          />
        </div>
        <div>
          <label>Do you have any other condition to inform us of?</label>
          <textarea name="otherConditions" value={formData.otherConditions} onChange={handleChange} />
        </div>

        <hr />
        <h4 style={{ fontWeight: "bold", textDecoration: "underline" }}>Family History</h4>
        <div>
          <label>Congenital Diseases:</label>
          {renderRadio("congenital", ["Yes", "No"])}
        </div>
        <div>
          <label>Other (please specify):</label>
          <input name="familyOther" value={formData.familyOther} onChange={handleChange} />
        </div>

        <hr />
        <h4 style={{ fontWeight: "bold", textDecoration: "underline" }}>Lifestyle</h4>
        <div>
          <label>Smoking?</label>
          {renderRadio("smoking", ["Yes", "No"])}
        </div>
        <div>
          <label>Recreational activities?</label>
          {renderRadio("recreation", ["Yes", "No"])}
        </div>

        <hr />
        <h4 style={{ fontWeight: "bold", textDecoration: "underline" }}>Mental Health</h4>
        <div>
          <label>Psychological Problems?</label>
          {renderRadio("psychological", ["Yes", "No"])}
          <input
            name="psychologicalDetails"
            placeholder="Please give details"
            value={formData.psychologicalDetails}
            onChange={handleChange}
          />
        </div>

        <hr />
        <h4 style={{ fontWeight: "bold", textDecoration: "underline" }}>Signature</h4>
        <p>Please sign below to confirm the information provided:</p>
        <canvas
          ref={signatureRef}
          width={600}
          height={150}
          style={{
            border: "1px solid #000",
            display: "block",
            marginBottom: "16px",
            cursor: "crosshair",
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        ></canvas>
        <button
          type="button"
          onClick={handleClearSignature}
          style={{
            backgroundColor: "#dc3545",
            color: "white",
            border: "none",
            padding: "8px 16px",
            marginRight: "10px",
            cursor: "pointer",
            borderRadius: "4px",
          }}
        >
          Clear Signature
        </button>
        <button
          type="submit"
          style={{
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            padding: "8px 16px",
            cursor: "pointer",
            borderRadius: "4px",
          }}
        >
          Submit and Continue
        </button>
      </form>
    </div>
  );
}

export default OnboardingPage;
