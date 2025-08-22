import React, { useState } from 'react';
import './LoginPage.css';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:5001/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Save user data to localStorage
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('role', data.user.role_name);

      // Redirect based on role
      if (data.user.role_name === 'nurse') {
        navigate('/nurse-dashboard');
      } else if (data.user.role_name === 'admin' || data.user.role_name === 'receptionist') {
        navigate('/admin-dashboard');
      } else {
        navigate('/patient-dashboard');
      }
    } catch (err) {
      setError(err.message || 'Invalid username or password. Please try again.');
    } finally {
      setIsLoading(false);
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

        <button 
          type="submit" 
          className="login-button"
          disabled={isLoading}
        >
          {isLoading ? 'LOGGING IN...' : 'LOGIN'}
        </button>
      </form>

      <button className="forgot-password">Forgot Password?</button>

      <div style={{ marginTop: 18, fontSize: 13, color: '#444' }}>
        <strong>Select forgot password to reset your login details:</strong>
        <ul style={{ marginTop: 6 }}>

        </ul>
      </div>
    </div>
  );
};

export default LoginPage;