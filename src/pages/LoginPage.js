import React, { useState } from 'react';
import './LoginPage.css';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';

const LoginPage = () => {
  const [staffNumber, setStaffNumber] = useState('');
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
        body: JSON.stringify({ staffNumber, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Save user data to localStorage
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('role', data.user.role_name);
      localStorage.setItem('staffNumber', staffNumber); // Store staff/student number

      // For patients, check if they've completed onboarding
      if (data.user.role_name === 'patient') {
        try {
          const onboardingCheck = await fetch('http://localhost:5001/api/check-onboarding', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ studentNumber: staffNumber }),
          });
          
          const onboardingData = await onboardingCheck.json();
          
          if (onboardingCheck.ok && onboardingData.exists) {
            // Patient has completed onboarding, go to dashboard
            navigate('/patient-dashboard');
          } else {
            // Patient needs to complete onboarding
            navigate('/onboarding');
          }
        } catch (err) {
          console.error('Error checking onboarding status:', err);
          // If there's an error checking, send to onboarding to be safe
          navigate('/onboarding');
        }
      } 
      // Redirect based on role for non-patients
      else if (data.user.role_name === 'nurse') {
        navigate('/nurse-dashboard');
      } else if (data.user.role_name === 'admin' || data.user.role_name === 'receptionist') {
        navigate('/admin-dashboard');
      } else {
        navigate('/patient-dashboard');
      }
    } catch (err) {
      setError(err.message || 'Invalid student/staff number or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h2 className="login-title">Wits Booking</h2>
      <img src={logo} alt="Campus Health and Wellness Centre" className="login-logo" />

      <form onSubmit={handleLogin}>
        <label className="login-label" htmlFor="staff/studentNumber">Student/Staff Number</label>
        <input
          type="text"
          id="staff/studentNumber"
          placeholder="Enter your student/staff number"
          className="login-input"
          value={staffNumber}
          onChange={(e) => setStaffNumber(e.target.value)}
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