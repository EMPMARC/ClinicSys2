const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const PORT = 5001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MySQL Connection
const db = mysql.createConnection({
  host: 'localhost',      // Replace if using a remote DB
  user: 'root',           // Your MySQL username
  password: 'CHWC2025Project', // Your MySQL password
  database: 'chwc' // Your database name
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
});