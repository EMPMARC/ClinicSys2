const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const app = express();
const PORT = 5001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MySQL Connection
const db = mysql.createConnection({
  host: 'chwc-database.choewaaukon8.eu-west-2.rds.amazonaws.com',
  user: 'admin',
  password: 'CHWC2025Project',
  database: 'chwc'
});

// Connect to MySQL
db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL Database!');
});

// Test route
app.get('/', (req, res) => {
  res.send('Backend is working!');
});

// Login endpoint - FIXED to include staff_number search
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  // Query to find user by username, email, OR staff_number
  const sql = `
    SELECT u.*, r.role_name 
    FROM users u 
    JOIN roles r ON u.role_id = r.id 
    WHERE u.username = ? OR u.email = ? OR u.staff_number = ?
  `;
  
  db.query(sql, [username, username, username], async (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (results.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    const user = results[0];
    
    // Compare password with hashed password in database
    try {
      const isMatch = await bcrypt.compare(password, user.password);
      
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      
      res.status(200).json({
        message: 'Login successful',
        user: userWithoutPassword
      });
    } catch (error) {
      console.error('Error comparing passwords:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });
});

// Password reset endpoint (for development)
app.post('/api/reset-passwords', async (req, res) => {
  try {
    // Hash the common password
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    // Update all users with the new hashed password
    const sql = 'UPDATE users SET password = ?';
    db.query(sql, [hashedPassword], (err, result) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Failed to reset passwords' });
      }
      res.status(200).json({ 
        message: 'Passwords reset successfully!',
        newPassword: 'password123',
        usersAffected: result.affectedRows
      });
    });
  } catch (error) {
    console.error('Error hashing password:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Debug endpoint to check user data
app.post('/api/debug-user', (req, res) => {
  const { username } = req.body;
  
  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  const sql = `
    SELECT u.*, r.role_name 
    FROM users u 
    JOIN roles r ON u.role_id = r.id 
    WHERE u.username = ? OR u.email = ? OR u.staff_number = ?
  `;
  
  db.query(sql, [username, username, username], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.status(200).json({ 
      userFound: results.length > 0,
      users: results,
      count: results.length
    });
  });
});

// Get all users endpoint (for debugging)
app.get('/api/users', (req, res) => {
  const sql = `
    SELECT u.id, u.username, u.email, u.staff_number, u.full_name, 
           r.role_name, u.is_active, u.created_at
    FROM users u 
    JOIN roles r ON u.role_id = r.id 
    ORDER BY u.id
  `;
  
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.status(200).json({ 
      users: results,
      count: results.length
    });
  });
});

// API Endpoint: Save onboarding data
app.post('/api/onboarding', (req, res) => {
  const formData = req.body;
  
  const sql = `
    INSERT INTO onboarding_students (
      student_number, surname, full_names, date_of_birth, gender, other_gender,
      physical_address, postal_address, code, email, cell, alt_number,
      emergency_name, emergency_relation, emergency_work_tel, emergency_cell,
      medical_conditions, operations, conditions_details, disability, disability_details,
      medication, medication_details, other_conditions, congenital, family_other,
      smoking, recreation, psychological, psychological_details, date, signature_data
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    formData.studentNumber,
    formData.surname,
    formData.fullNames,
    formData.dateOfBirth,
    formData.gender,
    formData.otherGender || null,
    formData.physicalAddress,
    formData.postalAddress,
    formData.code,
    formData.email,
    formData.cell,
    formData.altNumber || null,
    formData.emergencyName,
    formData.emergencyRelation,
    formData.emergencyWorkTel || null,
    formData.emergencyCell,
    formData.medicalConditions,
    formData.operations,
    formData.conditionsDetails || null,
    formData.disability,
    formData.disabilityDetails || null,
    formData.medication,
    formData.medicationDetails || null,
    formData.otherConditions || null,
    formData.congenital,
    formData.familyOther || null,
    formData.smoking,
    formData.recreation,
    formData.psychological,
    formData.psychologicalDetails || null,
    formData.date,
    formData.signatureData || null
  ];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ 
        error: 'Failed to save data',
        details: err.message 
      });
    }
    res.status(200).json({ 
      message: 'Form submitted successfully!', 
      recordId: result.insertId 
    });
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
  console.log(`Available endpoints:`);
  console.log(`- POST /api/login`);
  console.log(`- POST /api/reset-passwords (for development)`);
  console.log(`- POST /api/debug-user`);
  console.log(`- GET /api/users`);
  console.log(`- POST /api/onboarding`);
});