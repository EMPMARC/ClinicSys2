const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const app = express();
const PORT = 5001;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// MySQL Connection with connection pooling for better performance
const db = mysql.createPool({
  host: 'chwc-database.choewaaukon8.eu-west-2.rds.amazonaws.com',
  user: 'admin',
  password: 'CHWC2025Project',
  database: 'chwc',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test database connection
db.getConnection((err, connection) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL Database!');
  connection.release();
});

// Test route
app.get('/', (req, res) => {
  res.send('Backend is working!');
});

// Login endpoint
app.post('/api/login', (req, res) => {
  const { staffNumber, password } = req.body;
  
  if (!staffNumber || !password) {
    return res.status(400).json({ error: 'Staff number and password are required' });
  }

  const sql = `
    SELECT u.*, r.role_name 
    FROM users u 
    JOIN roles r ON u.role_id = r.id 
    WHERE u.staff_number = ?
  `;
  
  db.query(sql, [staffNumber], async (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error', details: err.message });
    }
    
    if (results.length === 0) {
      return res.status(401).json({ error: 'Invalid staff number or password' });
    }
    
    const user = results[0];
    
    try {
      const isMatch = await bcrypt.compare(password, user.password);
      
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid staff number or password' });
      }
      
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

// Check if student is already onboarded
app.post('/api/check-onboarding', (req, res) => {
  const { studentNumber } = req.body;
  
  if (!studentNumber) {
    return res.status(400).json({ error: 'Student number is required' });
  }

  const sql = 'SELECT id FROM onboarding_students WHERE student_number = ?';
  
  db.query(sql, [studentNumber], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error', details: err.message });
    }
    
    res.status(200).json({ 
      exists: results.length > 0
    });
  });
});

// Upload Proof of Registration endpoint with improved error handling
app.post('/api/upload-por', (req, res) => {
  const { studentNumber, fileName, fileData } = req.body;
  
  if (!studentNumber || !fileName || !fileData) {
    return res.status(400).json({ 
      error: 'Student number, file name, and file data are required' 
    });
  }
  
  // Validate file type by checking file extension
  if (!fileName.toLowerCase().endsWith('.pdf')) {
    return res.status(400).json({ 
      error: 'Only PDF files are allowed' 
    });
  }

  // First check if the por_uploads table exists
  const checkTableSql = `SELECT COUNT(*) as count FROM information_schema.tables 
                        WHERE table_schema = 'chwc' AND table_name = 'por_uploads'`;
  
  db.query(checkTableSql, (err, results) => {
    if (err) {
      console.error('Error checking table existence:', err);
      return res.status(500).json({ 
        error: 'Database error',
        details: 'Failed to check table existence: ' + err.message
      });
    }
    
    if (results[0].count === 0) {
      return res.status(500).json({ 
        error: 'Database table not found',
        details: 'The por_uploads table does not exist. Please run the SQL setup.'
      });
    }
    
    // Check if file already exists for this student
    const checkSql = 'SELECT id FROM por_uploads WHERE student_number = ?';
    
    db.query(checkSql, [studentNumber], (err, results) => {
      if (err) {
        console.error('Database error checking existing records:', err);
        return res.status(500).json({ 
          error: 'Database error',
          details: 'Failed to check existing records: ' + err.message
        });
      }
      
      if (results.length > 0) {
        // Update existing record
        const updateSql = 'UPDATE por_uploads SET file_name = ?, file_data = ?, uploaded_at = NOW() WHERE student_number = ?';
        
        db.query(updateSql, [fileName, Buffer.from(fileData, 'base64'), studentNumber], (err, result) => {
          if (err) {
            console.error('Database error updating file:', err);
            return res.status(500).json({ 
              error: 'Database error',
              details: 'Failed to update file: ' + err.message
            });
          }
          
          res.status(200).json({ 
            message: 'File updated successfully!',
            recordId: result.insertId 
          });
        });
      } else {
        // Insert new record
        const insertSql = 'INSERT INTO por_uploads (student_number, file_name, file_data, uploaded_at) VALUES (?, ?, ?, NOW())';
        
        db.query(insertSql, [studentNumber, fileName, Buffer.from(fileData, 'base64')], (err, result) => {
          if (err) {
            console.error('Database error saving file:', err);
            return res.status(500).json({ 
              error: 'Database error',
              details: 'Failed to save file: ' + err.message
            });
          }
          
          res.status(200).json({ 
            message: 'File saved successfully!', 
            recordId: result.insertId 
          });
        });
      }
    });
  });
});

// Save appointment to database
app.post('/api/save-appointment', (req, res) => {
  const {
    referenceNumber,
    userId,
    staffNumber,
    appointmentType,
    appointmentFor,
    appointmentDate,
    appointmentTime,
    previousAppointmentRef
  } = req.body;

  if (!referenceNumber || !userId || !staffNumber || !appointmentType || !appointmentFor || !appointmentTime) {
    return res.status(400).json({ 
      error: 'Missing required fields' 
    });
  }

  const sql = `
    INSERT INTO appointments (
      reference_number, user_id, staff_number, appointment_type, 
      appointment_for, appointment_date, appointment_time, previous_appointment_ref
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    referenceNumber,
    userId,
    staffNumber,
    appointmentType,
    appointmentFor,
    appointmentDate || null,
    appointmentTime,
    previousAppointmentRef || null
  ];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('Database error saving appointment:', err);
      return res.status(500).json({ 
        error: 'Failed to save appointment',
        details: err.message 
      });
    }
    
    res.status(200).json({ 
      message: 'Appointment saved successfully!', 
      appointmentId: result.insertId 
    });
  });
});

// Get user appointments
app.get('/api/user-appointments/:staffNumber', (req, res) => {
  const { staffNumber } = req.params;

  const sql = `
    SELECT a.*, u.full_name 
    FROM appointments a
    JOIN users u ON a.user_id = u.id
    WHERE a.staff_number = ?
    ORDER BY a.created_at DESC
  `;

  db.query(sql, [staffNumber], (err, results) => {
    if (err) {
      console.error('Database error fetching appointments:', err);
      return res.status(500).json({ 
        error: 'Failed to fetch appointments',
        details: err.message 
      });
    }
    
    res.status(200).json({ 
      appointments: results,
      count: results.length
    });
  });
});

// Get all appointments (for admin/nurse view)
app.get('/api/appointments', (req, res) => {
  const sql = `
    SELECT a.*, u.full_name 
    FROM appointments a
    JOIN users u ON a.user_id = u.id
    ORDER BY a.appointment_date DESC, a.appointment_time DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error('Database error fetching all appointments:', err);
      return res.status(500).json({ 
        error: 'Failed to fetch appointments',
        details: err.message 
      });
    }
    
    res.status(200).json({ 
      appointments: results,
      count: results.length
    });
  });
});

// Password reset endpoint (for development)
app.post('/api/reset-passwords', async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const sql = 'UPDATE users SET password = ?';
    db.query(sql, [hashedPassword], (err, result) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Failed to reset passwords', details: err.message });
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
  const { staffNumber } = req.body;
  
  if (!staffNumber) {
    return res.status(400).json({ error: 'Staff number is required' });
  }

  const sql = `
    SELECT u.*, r.role_name 
    FROM users u 
    JOIN roles r ON u.role_id = r.id 
    WHERE u.staff_number = ?
  `;
  
  db.query(sql, [staffNumber], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error', details: err.message });
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
      return res.status(500).json({ error: 'Database error', details: err.message });
    }
    
    res.status(200).json({ 
      users: results,
      count: results.length
    });
  });
});

// Get POR uploads endpoint (for debugging)
app.get('/api/por-uploads', (req, res) => {
  const sql = `
    SELECT id, student_number, file_name, uploaded_at
    FROM por_uploads 
    ORDER BY uploaded_at DESC
  `;
  
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error', details: err.message });
    }
    
    res.status(200).json({ 
      uploads: results,
      count: results.length
    });
  });
});

// Create POR uploads table if it doesn't exist (for development)
app.post('/api/create-por-table', (req, res) => {
  const createTableSql = `
    CREATE TABLE IF NOT EXISTS por_uploads (
      id INT AUTO_INCREMENT PRIMARY KEY,
      student_number VARCHAR(50) NOT NULL,
      file_name VARCHAR(255) NOT NULL,
      file_data LONGBLOB NOT NULL,
      uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_student (student_number)
    )
  `;
  
  db.query(createTableSql, (err, result) => {
    if (err) {
      console.error('Error creating table:', err);
      return res.status(500).json({ 
        error: 'Failed to create table',
        details: err.message 
      });
    }
    
    res.status(200).json({ 
      message: 'Table created successfully or already exists',
      result: result
    });
  });
});

// Create appointments table if it doesn't exist (for development)
app.post('/api/create-appointments-table', (req, res) => {
  const createTableSql = `
    CREATE TABLE IF NOT EXISTS appointments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      reference_number VARCHAR(50) NOT NULL UNIQUE,
      user_id INT NOT NULL,
      staff_number VARCHAR(50) NOT NULL,
      appointment_type VARCHAR(100) NOT NULL,
      appointment_for VARCHAR(100) NOT NULL,
      appointment_date DATE,
      appointment_time TIME NOT NULL,
      previous_appointment_ref VARCHAR(50),
      status ENUM('scheduled', 'completed', 'cancelled') DEFAULT 'scheduled',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;
  
  db.query(createTableSql, (err, result) => {
    if (err) {
      console.error('Error creating appointments table:', err);
      return res.status(500).json({ 
        error: 'Failed to create appointments table',
        details: err.message 
      });
    }
    
    res.status(200).json({ 
      message: 'Appointments table created successfully or already exists',
      result: result
    });
  });
});

// API Endpoint: Save onboarding data
app.post('/api/onboarding', (req, res) => {
  const formData = req.body;
  
  const checkSql = 'SELECT id FROM onboarding_students WHERE student_number = ?';
  
  db.query(checkSql, [formData.studentNumber], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ 
        error: 'Failed to check existing records',
        details: err.message 
      });
    }
    
    if (results.length > 0) {
      return res.status(409).json({ 
        error: 'Student already exists in the system',
        details: 'This student number has already completed the onboarding process'
      });
    }
    
    const insertSql = `
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

    db.query(insertSql, values, (err, result) => {
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
  console.log(`- POST /api/check-onboarding`);
  console.log(`- POST /api/upload-por`);
  console.log(`- POST /api/save-appointment`);
  console.log(`- GET /api/user-appointments/:staffNumber`);
  console.log(`- GET /api/appointments`);
  console.log(`- POST /api/reset-passwords (for development)`);
  console.log(`- POST /api/debug-user`);
  console.log(`- GET /api/users`);
  console.log(`- GET /api/por-uploads`);
  console.log(`- POST /api/create-por-table (for development)`);
  console.log(`- POST /api/create-appointments-table (for development)`);
  console.log(`- POST /api/onboarding`);
});