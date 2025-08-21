import React, { useState } from "react";

const ApproveProofPage = () => {
  // Temporary mock data (replace with DB/API later)
  const [submissions, setSubmissions] = useState([
    {
      id: 1,
      name: "John Doe",
      status: "Pending",
      fileUrl: "#", // No real file yet
    },
    {
      id: 2,
      name: "Jane Smith",
      status: "Pending",
      fileUrl: "https://example.com/sample-proof.pdf",
    },
    {
      id: 3,
      name: "Michael Brown",
      status: "Approved",
      fileUrl: "https://example.com/sample-proof.pdf",
    },
  ]);

  const handleApprove = (id) => {
    setSubmissions((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, status: "Approved" } : s
      )
    );
    // Later: call backend API here
  };

  const handleReject = (id) => {
    setSubmissions((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, status: "Rejected" } : s
      )
    );
    // Later: call backend API here
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Approve Proof of Registration</h1>
      <p>Review uploaded proofs and approve or reject them.</p>

      {submissions.length === 0 ? (
        <p>No submissions found.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 16 }}>
          <thead>
            <tr>
              <th style={{ border: "1px solid #ddd", padding: 8 }}>Student Name</th>
              <th style={{ border: "1px solid #ddd", padding: 8 }}>Status</th>
              <th style={{ border: "1px solid #ddd", padding: 8 }}>View Document</th>
              <th style={{ border: "1px solid #ddd", padding: 8 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((s) => (
              <tr key={s.id}>
                <td style={{ border: "1px solid #ddd", padding: 8 }}>{s.name}</td>
                <td style={{ border: "1px solid #ddd", padding: 8 }}>{s.status}</td>
                <td style={{ border: "1px solid #ddd", padding: 8 }}>
                  {s.fileUrl && s.fileUrl !== "#" ? (
                    <a href={s.fileUrl} target="_blank" rel="noopener noreferrer">
                      View Document
                    </a>
                  ) : (
                    <span style={{ color: "#888" }}>No document uploaded</span>
                  )}
                </td>
                <td style={{ border: "1px solid #ddd", padding: 8 }}>
                  <button
                    onClick={() => handleApprove(s.id)}
                    disabled={s.status !== "Pending"}
                    style={{ marginRight: 8 }}
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(s.id)}
                    disabled={s.status !== "Pending"}
                  >
                    Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ApproveProofPage;