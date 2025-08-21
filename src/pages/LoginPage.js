import React, { useState } from 'react';
import './LoginPage.css';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';

// ------------ Mock users (temporary) -------------
const mockUsers = [
  { id: 'p1', username: 'patient1', password: '1234', role: 'patient', name: 'Student One' },
  { id: 'p2', username: 'student2', password: 'pass', role: 'patient', name: 'Student Two' },
  { id: 'a1', username: 'admin1', password: 'abcd', role: 'admin', name: 'Admin' },
  { id: 'r2', username: 'reception1', password: 'g1356', role: 'receptionist', name: 'Reception' },
  { id: 'n1', username: 'nurse1', password: 'n1234', role: 'nurse', name: 'Nurse Alice' }, // Nurse account
];
// -------------------------------------------------

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');

    // 1) find user in mock list
    const foundUser = mockUsers.find(
      (u) => u.username === username.trim() && u.password === password
    );

    // 2) if not found, show error
    if (!foundUser) {
      setError('Invalid username or password. Try one of the sample accounts below.');
      return;
    }

    // 3) save user (temporary) and redirect depending on role
    localStorage.setItem('user', JSON.stringify(foundUser));
    localStorage.setItem('role', foundUser.role);

    if (foundUser.role === 'nurse') {
      navigate('/nurse-dashboard');   // ✅ redirect nurses to Nurse Dashboard
    } else if (foundUser.role === 'admin' || foundUser.role === 'receptionist') {
      navigate('/admin-dashboard');   // admin + reception
    } else {
      navigate('/patient-dashboard'); // patients
    }
  };

  return (
    <div className="login-container">
      <h2 className="login-title">Wits Booking</h2>
      <img src={logo} alt="Campus Health and Wellness Centre" className="login-logo" />

      <form onSubmit={handleLogin}>
        <label className="login-label" htmlFor="username">Username</label>
        <input
          type="text"
          id="username"
          placeholder="Staff number or email"
          className="login-input"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

        <label className="login-label" htmlFor="password">Password</label>
        <input
          type="password"
          id="password"
          placeholder="Your Wits password"
          className="login-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && <p className="login-error">{error}</p>}

        <button type="submit" className="login-button">LOGIN</button>
      </form>

      <button className="forgot-password">Forgot Password?</button>

      <div style={{ marginTop: 18, fontSize: 13, color: '#444' }}>
        <strong>Sample accounts (for testing):</strong>
        <ul style={{ marginTop: 6 }}>
          <li>Patient: <code>patient1 / 1234</code></li>
          <li>Patient: <code>student2 / pass</code></li>
          <li>Admin: <code>admin1 / abcd</code></li>
          <li>Reception: <code>reception1 / g1356</code></li>
          <li>Nurse: <code>nurse1 / n1234</code></li>
        </ul>
      </div>
    </div>
  );
};

export default LoginPage;