import React, { useState } from "react";

const ApproveProofPage = () => {
  const [studentNumberInput, setStudentNumberInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [por, setPor] = useState(null); // { id, student_number, file_name, uploaded_at, approval_status }
  const [decisionLoading, setDecisionLoading] = useState(false);

  const fetchPOR = async () => {
    setError("");
    setPor(null);
    if (!studentNumberInput.trim()) {
      setError("Please enter a student number");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5001/api/por/${encodeURIComponent(studentNumberInput.trim())}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "POR not found for this student");
      }
      const data = await res.json();
      setPor(data.por);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const decide = async (next) => {
    if (!por) return;
    setDecisionLoading(true);
    setError("");
    try {
      const res = await fetch(`http://localhost:5001/api/por/${encodeURIComponent(por.student_number)}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision: next })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to update decision');
      // Refresh POR to get latest status
      await fetchPOR();
    } catch (e) {
      setError(e.message);
    } finally {
      setDecisionLoading(false);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Approve Proof of Registration</h1>
      <p>Search a student's latest uploaded POR, review and approve or reject.</p>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 12, marginBottom: 12 }}>
        <input
          placeholder="Enter student number"
          value={studentNumberInput}
          onChange={(e) => setStudentNumberInput(e.target.value)}
          style={{ padding: 8, border: '1px solid #ccc', borderRadius: 4 }}
        />
        <button onClick={fetchPOR} disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {error && (
        <div style={{ color: '#b00020', marginBottom: 12 }}>{error}</div>
      )}

      {por && (
        <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
          <div style={{ marginBottom: 8 }}>
            <strong>Student Number:</strong> {por.student_number}
          </div>
          <div style={{ marginBottom: 8 }}>
            <strong>File:</strong> {por.file_name}
          </div>
          <div style={{ marginBottom: 8 }}>
            <strong>Uploaded:</strong> {new Date(por.uploaded_at).toLocaleString()}
          </div>
          <div style={{ marginBottom: 12 }}>
            <strong>Status:</strong> {por.approval_status}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <a
              href={`http://localhost:5001/api/download-file/${por.id}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ padding: '8px 12px', border: '1px solid #0b5ed7', borderRadius: 6, color: '#0b5ed7', textDecoration: 'none' }}
            >
              View / Download
            </a>
            <button
              onClick={() => decide('approved')}
              disabled={decisionLoading || por.approval_status === 'approved'}
              style={{ padding: '8px 12px' }}
            >
              Approve
            </button>
            <button
              onClick={() => decide('rejected')}
              disabled={decisionLoading || por.approval_status === 'rejected'}
              style={{ padding: '8px 12px' }}
            >
              Reject
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApproveProofPage;