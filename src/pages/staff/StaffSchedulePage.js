import React, { useState } from "react";

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

export default function StaffLunchSchedule() {
  const [month, setMonth] = useState("August");
  const [day, setDay] = useState(4);

  // We'll store temporary schedule data in state
  const [schedule, setSchedule] = useState(
    staffList.map((name) => ({
      name,
      lunch1: "",
      lunch2: "",
      notes: "",
    }))
  );

  const handleChange = (index, field, value) => {
    const updated = [...schedule];
    updated[index][field] = value;
    setSchedule(updated);
  };

  const handleSave = () => {
    console.log("Schedule for", month, day, schedule);
    alert("Schedule saved (temporarily — no database yet)");
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>Campus Health and Wellness Centre</h1>
      <h2>Month: 
        <select value={month} onChange={(e) => setMonth(e.target.value)}>
          <option>January</option>
          <option>February</option>
          <option>March</option>
          <option>April</option>
          <option>May</option>
          <option>June</option>
          <option>July</option>
          <option>August</option>
          <option>September</option>
          <option>October</option>
          <option>November</option>
          <option>December</option>
        </select>
      </h2>

      <h3>
        Date: 
        <input
          type="number"
          min="1"
          max="31"
          value={day}
          onChange={(e) => setDay(e.target.value)}
          style={{ width: "60px", marginLeft: "10px" }}
        />
      </h3>

      <table border="1" cellPadding="8" style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr style={{ backgroundColor: "#f2f2f2" }}>
            <th>Staff Name</th>
            <th>Lunch 1</th>
            <th>Lunch 2</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          {schedule.map((staff, index) => (
            <tr key={index}>
              <td>{staff.name}</td>
              <td>
                <input
                  type="text"
                  value={staff.lunch1}
                  onChange={(e) => handleChange(index, "lunch1", e.target.value)}
                  placeholder="HH:MM - HH:MM"
                />
              </td>
              <td>
                <input
                  type="text"
                  value={staff.lunch2}
                  onChange={(e) => handleChange(index, "lunch2", e.target.value)}
                  placeholder="HH:MM - HH:MM"
                />
              </td>
              <td>
                <input
                  type="text"
                  value={staff.notes}
                  onChange={(e) => handleChange(index, "notes", e.target.value)}
                  placeholder="e.g. WEC, Activation"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button
        onClick={handleSave}
        style={{
          marginTop: "20px",
          padding: "10px 20px",
          background: "#007bff",
          color: "white",
          border: "none",
          cursor: "pointer",
          borderRadius: "5px",
        }}
      >
        Save Schedule
      </button>
    </div>
  );
}