import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const staffList = [
  "Mr. Brian Jele",
  "Sr. Virginia Nobela",
  "Sr. Ludo Dube",
  "Sr. Constance Matshi",
  "Sr. Siminathi Bilankulu",
  "Sr. Simangele Sitoe",
  "Sr. Ntombi Daantjie",
  "HCT. Nodayimane Njoku",
  "Mr. Zandisile Mathafeni",
  "Mr. Tebogo Sibilanga",
  "Mrs. Brenda Mnisi",
  "Ms. Sizakele Nkosi",
  "Ms. Nomangezi Ziqubu",
];

export default function StaffSchedulePage() {
  const [month, setMonth] = useState(new Date().toLocaleString('default', { month: 'long' }));
  const [day, setDay] = useState(new Date().getDate());
  const navigate = useNavigate();

  const [schedule, setSchedule] = useState(
    staffList.map((name) => ({
      name,
      lunch1_start: "",
      lunch1_end: "",
      lunch2_start: "",
      lunch2_end: "",
      notes: "",
    }))
  );

  const handleTimeChange = (index, field, value) => {
    const updated = [...schedule];
    updated[index][field] = value;
    setSchedule(updated);
  };

  const handleSave = async () => {
    try {
      // Validate dates
      const selectedDay = parseInt(day);
      if (selectedDay < 1 || selectedDay > 31) {
        alert("Please enter a valid day (1-31)");
        return;
      }

      // Save each staff member's schedule
      for (const staff of schedule) {
        await axios.post("http://localhost:5001/api/save-staff-schedule", {
          staff_name: staff.name,
          month,
          day: selectedDay,
          lunch1_start: staff.lunch1_start,
          lunch1_end: staff.lunch1_end,
          lunch2_start: staff.lunch2_start,
          lunch2_end: staff.lunch2_end,
          notes: staff.notes
        });
      }
      
      alert("Schedule saved successfully!");
    } catch (error) {
      console.error("Error saving schedule:", error);
      alert("Failed to save schedule. Please try again.");
    }
  };

  const handleReviewSchedule = () => {
    navigate("/today-schedule");
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif", maxWidth: "1400px", margin: "0 auto" }}>
      <h1>Campus Health and Wellness Centre - Staff Schedule</h1>
      
      <div style={{ marginBottom: "20px", display: "flex", gap: "20px", alignItems: "center" }}>
        <div>
          <label style={{ fontWeight: "bold", marginRight: "10px" }}>Month:</label>
          <select 
            value={month} 
            onChange={(e) => setMonth(e.target.value)}
            style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
          >
            <option value="January">January</option>
            <option value="February">February</option>
            <option value="March">March</option>
            <option value="April">April</option>
            <option value="May">May</option>
            <option value="June">June</option>
            <option value="July">July</option>
            <option value="August">August</option>
            <option value="September">September</option>
            <option value="October">October</option>
            <option value="November">November</option>
            <option value="December">December</option>
          </select>
        </div>

        <div>
          <label style={{ fontWeight: "bold", marginRight: "10px" }}>Date:</label>
          <input
            type="number"
            min="1"
            max="31"
            value={day}
            onChange={(e) => setDay(e.target.value)}
            style={{ width: "60px", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
          />
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table border="1" cellPadding="10" style={{ borderCollapse: "collapse", width: "100%", fontSize: "14px" }}>
          <thead>
            <tr style={{ backgroundColor: "#f2f2f2" }}>
              <th style={{ padding: "12px", textAlign: "left", minWidth: "150px" }}>Staff Name</th>
              <th style={{ padding: "12px", textAlign: "center", minWidth: "120px" }}>Lunch 1 Start</th>
              <th style={{ padding: "12px", textAlign: "center", minWidth: "120px" }}>Lunch 1 End</th>
              <th style={{ padding: "12px", textAlign: "center", minWidth: "120px" }}>Lunch 2 Start</th>
              <th style={{ padding: "12px", textAlign: "center", minWidth: "120px" }}>Lunch 2 End</th>
              <th style={{ padding: "12px", textAlign: "left", minWidth: "150px" }}>Notes</th>
            </tr>
          </thead>
          <tbody>
            {schedule.map((staff, index) => (
              <tr key={index}>
                <td style={{ padding: "10px", fontWeight: "bold" }}>{staff.name}</td>
                
                {/* Lunch 1 Start */}
                <td style={{ padding: "10px" }}>
                  <input
                    type="text"
                    value={staff.lunch1_start}
                    onChange={(e) => handleTimeChange(index, "lunch1_start", e.target.value)}
                    placeholder="HH:MM AM/PM"
                    style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
                  />
                </td>
                
                {/* Lunch 1 End */}
                <td style={{ padding: "10px" }}>
                  <input
                    type="text"
                    value={staff.lunch1_end}
                    onChange={(e) => handleTimeChange(index, "lunch1_end", e.target.value)}
                    placeholder="HH:MM AM/PM"
                    style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
                  />
                </td>
                
                {/* Lunch 2 Start */}
                <td style={{ padding: "10px" }}>
                  <input
                    type="text"
                    value={staff.lunch2_start}
                    onChange={(e) => handleTimeChange(index, "lunch2_start", e.target.value)}
                    placeholder="HH:MM AM/PM"
                    style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
                  />
                </td>
                
                {/* Lunch 2 End */}
                <td style={{ padding: "10px" }}>
                  <input
                    type="text"
                    value={staff.lunch2_end}
                    onChange={(e) => handleTimeChange(index, "lunch2_end", e.target.value)}
                    placeholder="HH:MM AM/PM"
                    style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
                  />
                </td>
                
                <td style={{ padding: "10px" }}>
                  <input
                    type="text"
                    value={staff.notes}
                    onChange={(e) => handleTimeChange(index, "notes", e.target.value)}
                    placeholder="e.g., WEC, Activation, Off-site"
                    style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: "20px", display: "flex", justifyContent: "space-between", gap: "10px" }}>
        <button
          onClick={handleSave}
          style={{
            padding: "12px 24px",
            background: "#007bff",
            color: "white",
            border: "none",
            cursor: "pointer",
            borderRadius: "6px",
            fontSize: "16px",
            fontWeight: "bold",
          }}
        >
          Save Schedule
        </button>
        
        <button
          onClick={handleReviewSchedule}
          style={{
            padding: "12px 24px",
            background: "#28a745",
            color: "white",
            border: "none",
            cursor: "pointer",
            borderRadius: "6px",
            fontSize: "16px",
            fontWeight: "bold",
          }}
        >
          Review Today's Schedule
        </button>
      </div>
    </div>
  );
}