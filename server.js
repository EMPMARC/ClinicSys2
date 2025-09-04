const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
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
  // Ensure POR uploads table and approval columns exist at startup
  ensurePorTableExists(() => ensurePorApprovalColumns());
});

// Chart canvas setup
const width = 600;
const height = 400;
const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });

// 🔹 Helper function: Draws a clean table
function drawTable(doc, headers, rows, columnPositions) {
  const tableTop = doc.y;
  const rowHeight = 20;

  // Header row
  doc.font("Helvetica-Bold").fontSize(12);
  headers.forEach((header, i) => {
    doc.text(header, columnPositions[i], tableTop);
  });

  // Line under header
  doc.moveTo(columnPositions[0], tableTop + 15).lineTo(550, tableTop + 15).stroke();

  // Data rows
  doc.font("Helvetica").fontSize(11);
  let y = tableTop + 25;

  rows.forEach(row => {
    row.forEach((cell, i) => {
      doc.text(cell.toString(), columnPositions[i], y);
    });

    // Optional row separator
    doc.moveTo(columnPositions[0], y + 15).lineTo(550, y + 15)
       .dash(1, { space: 2 }).stroke().undash();

    y += rowHeight;
  });

  doc.moveDown();
}

// Test route
app.get('/', (req, res) => {
  res.send('Backend is working!');
});

// Add this after your other middleware
// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const extAllowed = /(\.jpeg|\.jpg|\.png|\.pdf|\.doc|\.docx|\.txt)$/i.test(file.originalname);
    const mimeAllowed = /^(image\/|application\/pdf|application\/msword|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document|text\/plain)/.test(file.mimetype);
    if (extAllowed || mimeAllowed) {
      return cb(null, true);
    }
    cb(new Error('Invalid file type'));
  }
});

// Ensure POR table has approval columns (compatible with older MySQL)
function ensurePorApprovalColumns(callback) {
  const checkSql = `
    SELECT COLUMN_NAME FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'por_uploads' 
      AND COLUMN_NAME IN ('approval_status','approved_at')
  `;
  db.query(checkSql, (err, results) => {
    if (err) {
      console.error('Error checking POR columns:', err);
      if (typeof callback === 'function') callback();
      return;
    }
    const existing = new Set(results.map(r => r.COLUMN_NAME));
    const tasks = [];
    if (!existing.has('approval_status')) {
      tasks.push(cb => db.query(
        "ALTER TABLE por_uploads ADD COLUMN approval_status ENUM('pending','approved','rejected') DEFAULT 'pending' AFTER uploaded_at",
        (e) => { if (e) console.error('Error adding approval_status:', e); cb(); }
      ));
    }
    if (!existing.has('approved_at')) {
      tasks.push(cb => db.query(
        "ALTER TABLE por_uploads ADD COLUMN approved_at DATETIME NULL AFTER approval_status",
        (e) => { if (e) console.error('Error adding approved_at:', e); cb(); }
      ));
    }
    if (tasks.length === 0) {
      if (typeof callback === 'function') callback();
      return;
    }
    // Run tasks sequentially
    const runNext = () => {
      const t = tasks.shift();
      if (!t) { if (typeof callback === 'function') callback(); return; }
      t(runNext);
    };
    runNext();
  });
}

// Ensure POR uploads table exists (idempotent)
function ensurePorTableExists(callback) {
  const createSql = `
    CREATE TABLE IF NOT EXISTS por_uploads (
      id INT AUTO_INCREMENT PRIMARY KEY,
      student_number VARCHAR(50) NOT NULL,
      file_name VARCHAR(255) NOT NULL,
      file_path VARCHAR(255) NULL,
      file_size INT NULL,
      mimetype VARCHAR(100) NULL,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;
  db.query(createSql, (err) => {
    if (err) {
      console.error('Error ensuring POR table exists:', err);
    }
    if (typeof callback === 'function') callback();
  });
}

// Helper functions for checking status
async function checkOnboardingStatus(studentNumber) {
  return new Promise((resolve) => {
    const sql = 'SELECT id FROM onboarding_students WHERE student_number = ?';
    db.query(sql, [studentNumber], (err, results) => {
      if (err) {
        console.error('Database error checking onboarding:', err);
        resolve({ exists: false });
      } else {
        resolve({ exists: results.length > 0 });
      }
    });
  });
}

async function checkPORStatus(studentNumber) {
  return new Promise((resolve) => {
    const sql = 'SELECT id, approval_status FROM por_uploads WHERE student_number = ?';
    ensurePorApprovalColumns(() => db.query(sql, [studentNumber], (err, results) => {
      if (err) {
        console.error('Database error checking POR:', err);
        resolve({ exists: false, approved: false });
      } else {
        const exists = results.length > 0;
        const approved = exists ? results[0].approval_status === 'approved' : false;
        resolve({ exists, approved });
      }
    }));
  });
}

// Login endpoint - UPDATED to check both users and students tables and return status
app.post('/api/login', async (req, res) => {
  const { identifier, password, userType } = req.body;
  
  if (!identifier || !password || !userType) {
    return res.status(400).json({ error: 'Identifier, password, and user type are required' });
  }

  if (userType === 'staff') {
    // Staff login (existing users table)
    const sql = `
      SELECT u.*, r.role_name 
      FROM users u 
      JOIN roles r ON u.role_id = r.id 
      WHERE u.staff_number = ? OR u.username = ?
    `;
    
    db.query(sql, [identifier, identifier], async (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error', details: err.message });
      }
      
      if (results.length === 0) {
        return res.status(401).json({ error: 'Invalid staff number/username or password' });
      }
      
      const user = results[0];
      
      try {
        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
          return res.status(401).json({ error: 'Invalid staff number/username or password' });
        }
        
        const { password: _, ...userWithoutPassword } = user;
        
        res.status(200).json({
          message: 'Login successful',
          user: userWithoutPassword,
          userType: 'staff'
        });
      } catch (error) {
        console.error('Error comparing passwords:', error);
        res.status(500).json({ error: 'Server error' });
      }
    });
  } else if (userType === 'student') {
    const sql = `
      SELECT s.*, r.role_name 
      FROM students s 
      JOIN roles r ON s.role_id = r.id 
      WHERE s.student_number = ? OR s.username = ?
    `;
    
    db.query(sql, [identifier, identifier], async (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error', details: err.message });
      }
      
      if (results.length === 0) {
        return res.status(401).json({ error: 'Invalid student number/username or password' });
      }
      
      const student = results[0];
      
      try {
        const isMatch = await bcrypt.compare(password, student.password);
        
        if (!isMatch) {
          return res.status(401).json({ error: 'Invalid student number/username or password' });
        }
        
        const { password: _, ...studentWithoutPassword } = student;
        
        // Check both onboarding and POR status
        const onboardingCheck = await checkOnboardingStatus(identifier);
        const porCheck = await checkPORStatus(identifier);
        
        res.status(200).json({
          message: 'Login successful',
          user: studentWithoutPassword,
          userType: 'student',
          onboardingCompleted: onboardingCheck.exists,
          porUploaded: porCheck.exists,
          porApproved: porCheck.approved
        });
      } catch (error) {
        console.error('Error comparing passwords:', error);
        res.status(500).json({ error: 'Server error' });
      }
    });
  } else {
    return res.status(400).json({ error: 'Invalid user type' });
  }
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

// Check if student has uploaded proof of registration
app.post('/api/check-por', (req, res) => {
  const { studentNumber } = req.body;
  
  if (!studentNumber) {
    return res.status(400).json({ error: 'Student number is required' });
  }

  const sql = 'SELECT id, approval_status FROM por_uploads WHERE student_number = ?';
  
  ensurePorApprovalColumns(() => db.query(sql, [studentNumber], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error', details: err.message });
    }
    
    const exists = results.length > 0;
    const approved = exists ? results[0].approval_status === 'approved' : false;
    res.status(200).json({ exists, approved });
  }));
});

// Update your existing upload-por endpoint to use multer
app.post('/api/upload-por-multer', upload.single('document'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { studentNumber } = req.body;
    
    if (!studentNumber) {
      return res.status(400).json({ error: 'Student number is required' });
    }

    const fileData = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      path: req.file.path,
      studentNumber: studentNumber,
      uploadDate: new Date()
    };

   // Check if file already exists for this student
    const checkSql = 'SELECT id FROM por_uploads WHERE student_number = ?';
    
    ensurePorApprovalColumns(() => db.query(checkSql, [studentNumber], (err, results) => {
      if (err) {
        console.error('Database error checking existing records:', err);
        return res.status(500).json({ 
          error: 'Database error',
          details: 'Failed to check existing records: ' + err.message
        });
      }
      
      if (results.length > 0) {
        // Update existing record
        const updateSql = 'UPDATE por_uploads SET file_name = ?, file_path = ?, file_size = ?, mimetype = ?, uploaded_at = NOW(), approval_status = "pending" WHERE student_number = ?';
        
        db.query(updateSql, [fileData.originalName, fileData.path, fileData.size, fileData.mimetype, studentNumber], (err, result) => {
          if (err) {
            console.error('Database error updating file:', err);
            return res.status(500).json({ 
              error: 'Database error',
              details: 'Failed to update file: ' + err.message
            });
          }
          
          res.status(200).json({ 
            message: 'File updated successfully!',
            file: fileData
          });
        });
      } else {
        // Insert new record
        const insertSql = 'INSERT INTO por_uploads (student_number, file_name, file_path, file_size, mimetype, uploaded_at, approval_status) VALUES (?, ?, ?, ?, ?, NOW(), "pending")';
        
        db.query(insertSql, [studentNumber, fileData.originalName, fileData.path, fileData.size, fileData.mimetype], (err, result) => {
          if (err) {
            console.error('Database error saving file:', err);
            return res.status(500).json({ 
              error: 'Database error',
              details: 'Failed to save file: ' + err.message
            });
          }
          
          res.status(200).json({ 
            message: 'File saved successfully!', 
            file: fileData
          });
        });
      }
    }));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: get POR by student number (with latest file info)
app.get('/api/por/:studentNumber', (req, res) => {
  const { studentNumber } = req.params;
  const sql = `
    SELECT id, student_number, file_name, file_path, file_size, mimetype, uploaded_at, COALESCE(approval_status, 'pending') AS approval_status
    FROM por_uploads
    WHERE student_number = ?
    ORDER BY uploaded_at DESC
    LIMIT 1
  `;
  ensurePorApprovalColumns(() => db.query(sql, [studentNumber], (err, results) => {
    if (err) {
      console.error('Database error fetching POR:', err);
      return res.status(500).json({ error: 'Failed to fetch POR', details: err.message });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'No POR found for this student' });
    }
    res.status(200).json({ por: results[0] });
  }));
});

// Admin: approve/reject POR
app.post('/api/por/:studentNumber/decision', (req, res) => {
  const { studentNumber } = req.params;
  const { decision } = req.body; // 'approved' or 'rejected'
  if (!['approved', 'rejected'].includes(decision)) {
    return res.status(400).json({ error: 'Invalid decision' });
  }
  const sql = `
    UPDATE por_uploads
    SET approval_status = ?, approved_at = CASE WHEN ? = 'approved' THEN NOW() ELSE NULL END
    WHERE student_number = ?
    ORDER BY uploaded_at DESC
    LIMIT 1
  `;
  ensurePorApprovalColumns(() => db.query(sql, [decision, decision, studentNumber], (err, result) => {
    if (err) {
      console.error('Database error updating POR decision:', err);
      return res.status(500).json({ error: 'Failed to update POR decision', details: err.message });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'No POR record found to update' });
    }
    res.status(200).json({ message: `POR ${decision} successfully` });
  }));
});
// Add endpoint to get uploaded files
app.get('/api/student-files/:studentNumber', (req, res) => {
  const { studentNumber } = req.params;

  const sql = `
    SELECT id, file_name, file_size, mimetype, uploaded_at
    FROM por_uploads 
    WHERE student_number = ?
    ORDER BY uploaded_at DESC
  `;

  db.query(sql, [studentNumber], (err, results) => {
    if (err) {
      console.error('Database error fetching files:', err);
      return res.status(500).json({ 
        error: 'Failed to fetch files',
        details: err.message 
      });
    }
    
    res.status(200).json({ 
      files: results,
      count: results.length
    });
  });
});

// Add endpoint to download file
app.get('/api/download-file/:id', (req, res) => {
  const { id } = req.params;

  const sql = 'SELECT file_path, file_name, mimetype FROM por_uploads WHERE id = ?';
  
  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error', details: err.message });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    const file = results[0];
    
    if (!fs.existsSync(file.file_path)) {
      return res.status(404).json({ error: 'File not found on server' });
    }
    
    res.setHeader('Content-Type', file.mimetype);
    res.setHeader('Content-Disposition', `attachment; filename="${file.file_name}"`);
    
    const fileStream = fs.createReadStream(file.file_path);
    fileStream.pipe(res);
  });
});


// Create appointments table if it doesn't exist
app.post('/api/create-appointments-table', (req, res) => {
  const createTableSql = `
    CREATE TABLE IF NOT EXISTS appointments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      reference_number VARCHAR(50) NOT NULL,
      student_number VARCHAR(50) NOT NULL,
      appointment_type VARCHAR(100) NOT NULL,
      appointment_for VARCHAR(100) NOT NULL,
      appointment_date DATE NULL,
      appointment_time TIME NOT NULL,
      previous_appointment_ref VARCHAR(50) NULL,
      status VARCHAR(20) DEFAULT 'scheduled',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
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

// Save appointment to database - UPDATED to use student number
app.post('/api/save-appointment', (req, res) => {
  const {
    referenceNumber,
    studentNumber,
    appointmentType,
    appointmentFor,
    appointmentDate,
    appointmentTime,
    previousAppointmentRef
  } = req.body;

  console.log('Received appointment data:', req.body);

  if (!referenceNumber || !studentNumber || !appointmentType || !appointmentFor || !appointmentTime) {
    return res.status(400).json({ 
      error: 'Missing required fields',
      details: `Missing: ${!referenceNumber ? 'referenceNumber, ' : ''}${!studentNumber ? 'studentNumber, ' : ''}${!appointmentType ? 'appointmentType, ' : ''}${!appointmentFor ? 'appointmentFor, ' : ''}${!appointmentTime ? 'appointmentTime' : ''}`
    });
  }

  const sql = `
    INSERT INTO appointments (
      reference_number, student_number, appointment_type, 
      appointment_for, appointment_date, appointment_time, previous_appointment_ref
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    referenceNumber,
    studentNumber,
    appointmentType,
    appointmentFor,
    appointmentDate || null,
    appointmentTime,
    previousAppointmentRef || null
  ];

  console.log('Executing SQL with values:', values);

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('Database error saving appointment:', err);
      return res.status(500).json({ 
        error: 'Failed to save appointment',
        details: err.message,
        sqlError: err
      });
    }
    
    res.status(200).json({ 
      message: 'Appointment saved successfully!', 
      appointmentId: result.insertId 
    });
  });
});

// Get student appointments - FIXED to handle missing students table gracefully
app.get('/api/student-appointments/:studentNumber', (req, res) => {
  const { studentNumber } = req.params;

  console.log('Fetching appointments for student:', studentNumber);

  // First check if appointments table exists
  const checkTableSql = `SHOW TABLES LIKE 'appointments'`;
  
  db.query(checkTableSql, (err, results) => {
    if (err) {
      console.error('Database error checking appointments table:', err);
      return res.status(500).json({ 
        error: 'Database error',
        details: err.message 
      });
    }

    if (results.length === 0) {
      // Appointments table doesn't exist
      return res.status(200).json({ 
        appointments: [],
        count: 0,
        message: 'No appointments table found'
      });
    }

    // Table exists, now fetch appointments
    const sql = `
      SELECT a.* 
      FROM appointments a
      WHERE a.student_number = ?
      ORDER BY a.created_at DESC
    `;

    db.query(sql, [studentNumber], (err, results) => {
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
});

// Get all appointments (for admin/nurse view)
app.get('/api/appointments', (req, res) => {
  const sql = `
    SELECT a.* 
    FROM appointments a
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

// Get appointments by student number (for modify booking page)
app.get('/api/appointments/student/:studentNumber', (req, res) => {
  const { studentNumber } = req.params;

  const sql = `
    SELECT a.* 
    FROM appointments a
    WHERE a.student_number = ?
    ORDER BY a.appointment_date DESC, a.appointment_time DESC
  `;

  db.query(sql, [studentNumber], (err, results) => {
    if (err) {
      console.error('Database error fetching appointments by student number:', err);
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

// Update appointment
app.put('/api/appointments/:id', (req, res) => {
  const { id } = req.params;
  const { appointmentDate, appointmentTime, appointmentFor, status } = req.body;

  if (!appointmentDate || !appointmentTime || !appointmentFor) {
    return res.status(400).json({ 
      error: 'Missing required fields',
      details: 'appointmentDate, appointmentTime, and appointmentFor are required'
    });
  }

  const sql = `
    UPDATE appointments 
    SET appointment_date = ?, appointment_time = ?, appointment_for = ?, 
        status = ?, updated_at = NOW()
    WHERE id = ?
  `;

  const values = [appointmentDate, appointmentTime, appointmentFor, status || 'scheduled', id];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('Database error updating appointment:', err);
      return res.status(500).json({ 
        error: 'Failed to update appointment',
        details: err.message 
      });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        error: 'Appointment not found'
      });
    }
    
    res.status(200).json({ 
      message: 'Appointment updated successfully!'
    });
  });
});

// Cancel appointment (set status to cancelled)
app.put('/api/appointments/:id/cancel', (req, res) => {
  const { id } = req.params;

  const sql = `
    UPDATE appointments 
    SET status = 'cancelled', updated_at = NOW()
    WHERE id = ?
  `;

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error('Database error cancelling appointment:', err);
      return res.status(500).json({ 
        error: 'Failed to cancel appointment',
        details: err.message 
      });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        error: 'Appointment not found'
      });
    }
    
    res.status(200).json({ 
      message: 'Appointment cancelled successfully!'
    });
  });
});

// Create students table if it doesn't exist (matching users table structure)
app.post('/api/create-students-table', (req, res) => {
  const createTableSql = `
    CREATE TABLE IF NOT EXISTS students (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(100) NOT NULL,
      password VARCHAR(255) NOT NULL,
      student_number VARCHAR(50) UNIQUE NOT NULL,
      full_name VARCHAR(100) NOT NULL,
      role_id INT NOT NULL DEFAULT 1,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `;

  db.query(createTableSql, (err, result) => {
    if (err) {
      console.error('Error creating students table:', err);
      return res.status(500).json({ 
        error: 'Failed to create students table',
        details: err.message 
      });
    }
    
    res.status(200).json({ 
      message: 'Students table created successfully or already exists',
      result: result
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
  ORDER by u.id
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

// Update the POR uploads table structure to include file_path
app.post('/api/update-por-table-structure', (req, res) => {
  const alterTableSql = `
    ALTER TABLE por_uploads 
    ADD COLUMN file_path VARCHAR(255) AFTER file_name,
    ADD COLUMN file_size INT AFTER file_path,
    ADD COLUMN mimetype VARCHAR(100) AFTER file_size
  `;

  db.query(alterTableSql, (err, result) => {
    if (err) {
      console.error('Error updating POR table structure:', err);
      return res.status(500).json({ 
        error: 'Failed to update POR table structure',
        details: err.message 
      });
    }
    
    res.status(200).json({ 
      message: 'POR table structure updated successfully',
      result: result
    });
  });
});

// Update appointments table to use student_number instead of user_id/staff_number
app.post('/api/update-appointments-table', (req, res) => {
  const alterTableSql = `
    ALTER TABLE appointments 
    DROP COLUMN IF EXISTS user_id,
    DROP COLUMN IF EXISTS staff_number,
    ADD COLUMN IF NOT EXISTS student_number VARCHAR(50) NOT NULL AFTER reference_number
  `;

  db.query(alterTableSql, (err, result) => {
    if (err) {
      console.error('Error updating appointments table:', err);
      return res.status(500).json({ 
        error: 'Failed to update appointments table',
        details: err.message 
      });
    }
    
    res.status(200).json({ 
      message: 'Appointments table updated successfully',
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

// Create student account endpoint
app.post('/api/create-student', async (req, res) => {
  const { username, email, password, studentNumber, fullName, roleId = 1 } = req.body;
  
  if (!username || !email || !password || !studentNumber || !fullName) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const sql = `
      INSERT INTO students (username, email, password, student_number, full_name, role_id) 
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    db.query(sql, [username, email, hashedPassword, studentNumber, fullName, roleId], (err, result) => {
      if (err) {
        console.error('Database error creating student:', err);
        return res.status(500).json({ 
          error: 'Failed to create student account',
          details: err.message 
        });
      }
      
      res.status(200).json({ 
        message: 'Student account created successfully!',
        studentId: result.insertId 
      });
    });
  } catch (error) {
    console.error('Error hashing password:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Reset student password endpoint
app.post('/api/reset-student-password', async (req, res) => {
  const { studentNumber, newPassword } = req.body;
  
  if (!studentNumber || !newPassword) {
    return res.status(400).json({ error: 'Student number and new password are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    const sql = `
      UPDATE students 
      SET password = ? 
      WHERE student_number = ?
    `;
    
    db.query(sql, [hashedPassword, studentNumber], (err, result) => {
      if (err) {
        console.error('Database error resetting password:', err);
        return res.status(500).json({ 
          error: 'Failed to reset password',
          details: err.message 
        });
      }
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ 
          error: 'Student not found',
          details: 'No student found with the provided student number'
        });
      }
      
      res.status(200).json({ 
        message: 'Password reset successfully!'
      });
    });
  } catch (error) {
    console.error('Error hashing password:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all students
app.get('/api/students', (req, res) => {
  const sql = `
    SELECT s.*
    FROM students s 
    ORDER BY s.id
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error('Database error fetching students:', err);
      return res.status(500).json({ 
        error: 'Failed to fetch students',
        details: err.message 
      });
    }
    
    res.status(200).json({ 
      students: results,
      count: results.length
    });
  });
});

// Save staff schedule endpoint (UPDATED for time picker)
app.post('/api/save-staff-schedule', (req, res) => {
  const { staff_name, month, day, lunch1_start, lunch1_end, lunch2_start, lunch2_end, notes } = req.body;
  
  if (!staff_name || !month || !day) {
    return res.status(400).json({ error: 'Staff name, month, and day are required' });
  }

  const sql = `
    INSERT INTO staff_lunch_schedule (staff_name, month, day, lunch1_start, lunch1_end, lunch2_start, lunch2_end, notes) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE 
      lunch1_start = VALUES(lunch1_start), 
      lunch1_end = VALUES(lunch1_end),
      lunch2_start = VALUES(lunch2_start),
      lunch2_end = VALUES(lunch2_end),
      notes = VALUES(notes),
      updated_at = NOW()
  `;
  
  const values = [staff_name, month, day, lunch1_start, lunch1_end, lunch2_start, lunch2_end, notes];
  
  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('Database error saving staff schedule:', err);
      return res.status(500).json({ 
        error: 'Failed to save staff schedule',
        details: err.message 
      });
    }
    
    res.status(200).json({ 
      message: 'Staff schedule saved successfully!', 
      recordId: result.insertId 
    });
  });
});

// Get today's staff schedule (UPDATED for time picker)
app.get('/api/today-staff-schedule', (req, res) => {
  const today = new Date();
  const month = today.toLocaleString('default', { month: 'long' });
  const day = today.getDate();
  
  const sql = `
    SELECT 
      staff_name, 
      lunch1_start, 
      lunch1_end, 
      lunch2_start, 
      lunch2_end,
      notes,
      CONCAT(
        IFNULL(CONCAT(TIME_FORMAT(lunch1_start, '%h:%i %p'), ' - ', TIME_FORMAT(lunch1_end, '%h:%i %p')), ''),
        IF(lunch1_start IS NOT NULL AND lunch2_start IS NOT NULL, ' / ', ''),
        IFNULL(CONCAT(TIME_FORMAT(lunch2_start, '%h:%i %p'), ' - ', TIME_FORMAT(lunch2_end, '%h:%i %p')), '')
      ) as lunch_times
    FROM staff_lunch_schedule 
    WHERE month = ? AND day = ?
    ORDER BY staff_name
  `;
  
  db.query(sql, [month, day], (err, results) => {
    if (err) {
      console.error('Database error fetching today\'s schedule:', err);
      return res.status(500).json({ 
        error: 'Failed to fetch today\'s schedule',
        details: err.message 
      });
    }
    
    res.status(200).json({ 
      schedule: results,
      date: `${month} ${day}`,
      count: results.length
    });
  });
});

// Create staff_schedule table if it doesn't exist (UPDATED for time picker)
app.post('/api/create-staff-schedule-table', (req, res) => {
  const createTableSql = `
    CREATE TABLE IF NOT EXISTS staff_lunch_schedule (
      id INT AUTO_INCREMENT PRIMARY KEY,
      staff_name VARCHAR(255) NOT NULL,
      month VARCHAR(20) NOT NULL,
      day INT NOT NULL,
      lunch1_start TIME NULL,
      lunch1_end TIME NULL,
      lunch2_start TIME NULL,
      lunch2_end TIME NULL,
      notes TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_schedule_entry (staff_name, month, day)
    )
  `;
  
  db.query(createTableSql, (err, result) => {
    if (err) {
      console.error('Error creating staff_schedule table:', err);
      return res.status(500).json({ 
        error: 'Failed to create staff_schedule table',
        details: err.message 
      });
    }
    
    res.status(200).json({ 
      message: 'Staff schedule table created successfully or already exists',
      result: result
    });
  });
});

// Create emergency_onboarding table if it doesn't exist
app.post('/api/create-emergency-table', (req, res) => {
  const createTableSql = `
    CREATE TABLE IF NOT EXISTS emergency_onboarding (
      id INT AUTO_INCREMENT PRIMARY KEY,
      date DATE NOT NULL,
      time_of_call TIME NOT NULL,
      person_responsible VARCHAR(255) NOT NULL,
      caller_name VARCHAR(255) NOT NULL,
      department VARCHAR(255) NOT NULL,
      contact_number VARCHAR(20) NOT NULL,
      problem_nature TEXT NOT NULL,
      
      east_campus BOOLEAN DEFAULT FALSE,
      west_campus BOOLEAN DEFAULT FALSE,
      education_campus BOOLEAN DEFAULT FALSE,
      other_campus BOOLEAN DEFAULT FALSE,
      building VARCHAR(255),
      room_number VARCHAR(50),
      floor VARCHAR(50),
      other_location VARCHAR(255),
      
      staff_informed VARCHAR(255) NOT NULL,
      notification_time TIME NOT NULL,
      team_responding VARCHAR(255) NOT NULL,
      time_left_clinic TIME NOT NULL,
      
      chwc_vehicle BOOLEAN DEFAULT FALSE,
      sisters_on_foot BOOLEAN DEFAULT FALSE,
      other_transport BOOLEAN DEFAULT FALSE,
      other_transport_detail VARCHAR(255),
      
      arrival_time TIME NOT NULL,
      
      student_number VARCHAR(50) NOT NULL,
      patient_name VARCHAR(255) NOT NULL,
      patient_surname VARCHAR(255) NOT NULL,
      
      primary_assessment TEXT NOT NULL,
      intervention TEXT NOT NULL,
      
      medical_consent ENUM('give', 'doNotGive') NOT NULL,
      transport_consent ENUM('consent', 'doNotConsent') NOT NULL,
      signature VARCHAR(255) NOT NULL,
      consent_date DATE NOT NULL,
      
      pt_chwc_vehicle BOOLEAN DEFAULT FALSE,
      pt_ambulance BOOLEAN DEFAULT FALSE,
      pt_other BOOLEAN DEFAULT FALSE,
      pt_other_detail VARCHAR(255),
      patient_transported_to VARCHAR(255) NOT NULL,
      departure_time TIME NOT NULL,
      
      chwc_arrival_time TIME NOT NULL,
      existing_file ENUM('yes', 'no') NOT NULL,
      referred ENUM('yes', 'no') NOT NULL,
      hospital_name VARCHAR(255),
      discharge_condition TEXT NOT NULL,
      discharge_time TIME NOT NULL,
      
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `;
  
  db.query(createTableSql, (err, result) => {
    if (err) {
      console.error('Error creating emergency_onboarding table:', err);
      return res.status(500).json({ 
        error: 'Failed to create emergency_onboarding table',
        details: err.message 
      });
    }
    
    res.status(200).json({ 
      message: 'Emergency onboarding table created successfully or already exists',
      result: result
    });
  });
});

// Save emergency onboarding data
app.post('/api/emergency-onboarding', (req, res) => {
  const formData = req.body;
  
  // Validate required fields
  const requiredFields = [
    'date', 'timeOfCall', 'personResponsible', 'callerName', 'department',
    'contactNumber', 'problemNature', 'staffInformed', 'notificationTime',
    'teamResponding', 'timeLeftClinic', 'arrivalTime', 'studentNumber',
    'patientName', 'patientSurname', 'primaryAssessment', 'intervention',
    'medicalConsent', 'transportConsent', 'signature', 'consentDate',
    'patientTransportedTo', 'departureTime', 'chwcArrivalTime',
    'existingFile', 'referred', 'dischargeCondition', 'dischargeTime'
  ];
  
  for (const field of requiredFields) {
    if (!formData[field]) {
      return res.status(400).json({ 
        error: `Missing required field: ${field}`,
        details: `The field '${field}' is required`
      });
    }
  }

  const sql = `
    INSERT INTO emergency_onboarding (
      date, time_of_call, person_responsible, caller_name, department,
      contact_number, problem_nature, east_campus, west_campus, education_campus,
      other_campus, building, room_number, floor, other_location, staff_informed,
      notification_time, team_responding, time_left_clinic, chwc_vehicle,
      sisters_on_foot, other_transport, other_transport_detail, arrival_time,
      student_number, patient_name, patient_surname, primary_assessment,
      intervention, medical_consent, transport_consent, signature, consent_date,
      pt_chwc_vehicle, pt_ambulance, pt_other, pt_other_detail,
      patient_transported_to, departure_time, chwc_arrival_time, existing_file,
      referred, discharge_condition, discharge_time
      referred, hospital_name, discharge_condition, discharge_time
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    formData.date,
    formData.timeOfCall,
    formData.personResponsible,
    formData.callerName,
    formData.department,
    formData.contactNumber,
    formData.problemNature,
    formData.eastCampus || false,
    formData.westCampus || false,
    formData.educationCampus || false,
    formData.otherCampus || false,
    formData.building || null,
    formData.roomNumber || null,
    formData.floor || null,
    formData.otherLocation || null,
    formData.staffInformed,
    formData.notificationTime,
    formData.teamResponding,
    formData.timeLeftClinic,
    formData.chwcVehicle || false,
    formData.sistersOnFoot || false,
    formData.otherTransport || false,
    formData.otherTransportDetail || null,
    formData.arrivalTime,
    formData.studentNumber,
    formData.patientName,
    formData.patientSurname,
    formData.primaryAssessment,
    formData.intervention,
    formData.medicalConsent,
    formData.transportConsent,
    formData.signature,
    formData.consentDate,
    formData.ptCHWCVehicle || false,
    formData.ptAmbulance || false,
    formData.ptOther || false,
    formData.ptOtherDetail || null,
    formData.patientTransportedTo,
    formData.departureTime,
    formData.chwcArrivalTime,
    formData.existingFile,
    formData.referred,
    formData.hospitalName || null,
    formData.dischargeCondition,
    formData.dischargeTime
  ];

  console.log('SQL values count:', values.length);
  console.log('Values:', values);
  console.log('SQL:', sql);

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('Database error saving emergency onboarding:', err);
      return res.status(500).json({ 
        error: 'Failed to save emergency report',
        details: err.message 
      });
    }
    
    res.status(200).json({ 
      message: 'Emergency report submitted successfully!', 
      recordId: result.insertId 
    });
  });
});

// Get emergency table structure
app.get('/api/emergency-table-structure', (req, res) => {
  const sql = 'DESCRIBE emergency_onboarding';
  
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Database error fetching table structure:', err);
      return res.status(500).json({ 
        error: 'Failed to fetch table structure',
        details: err.message 
      });
    }
    
    res.status(200).json({ 
      structure: results,
      count: results.length
    });
  });
});

// Get all emergency reports
app.get('/api/emergency-reports', (req, res) => {
  const sql = `
    SELECT 
      id, date, time_of_call, caller_name, department, 
      patient_name, patient_surname, student_number,
      created_at
    FROM emergency_onboarding 
    ORDER BY created_at DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error('Database error fetching emergency reports:', err);
      return res.status(500).json({ 
        error: 'Failed to fetch emergency reports',
        details: err.message 
      });
    }
    
    res.status(200).json({ 
      reports: results,
      count: results.length
    });
  });
});

// Get single emergency report by ID
app.get('/api/emergency-report/:id', (req, res) => {
  const { id } = req.params;

  const sql = 'SELECT * FROM emergency_onboarding WHERE id = ?';

  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error('Database error fetching emergency report:', err);
      return res.status(500).json({ 
        error: 'Failed to fetch emergency report',
        details: err.message 
      });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ 
        error: 'Emergency report not found'
      });
    }
    
    res.status(200).json({ 
      report: results[0]
    });
  });
});

// Update emergency report
app.put('/api/emergency-report/:id', (req, res) => {
  const { id } = req.params;
  const formData = req.body;

  const sql = `
    UPDATE emergency_onboarding SET
      date = ?, time_of_call = ?, person_responsible = ?, caller_name = ?, department = ?,
      contact_number = ?, problem_nature = ?, east_campus = ?, west_campus = ?, education_campus = ?,
      other_campus = ?, building = ?, room_number = ?, floor = ?, other_location = ?, staff_informed = ?,
      notification_time = ?, team_responding = ?, time_left_clinic = ?, chwc_vehicle = ?,
      sisters_on_foot = ?, other_transport = ?, other_transport_detail = ?, arrival_time = ?,
      student_number = ?, patient_name = ?, patient_surname = ?, primary_assessment = ?,
      intervention = ?, medical_consent = ?, transport_consent = ?, signature = ?, consent_date = ?,
      pt_chwc_vehicle = ?, pt_ambulance = ?, pt_other = ?, pt_other_detail = ?,
      patient_transported_to = ?, departure_time = ?, chwc_arrival_time = ?, existing_file = ?,
      referred = ?, hospital_name = ?, discharge_condition = ?, discharge_time = ?
    WHERE id = ?
  `;

  const values = [
    formData.date,
    formData.timeOfCall,
    formData.personResponsible,
    formData.callerName,
    formData.department,
    formData.contactNumber,
    formData.problemNature,
    formData.eastCampus || false,
    formData.westCampus || false,
    formData.educationCampus || false,
    formData.otherCampus || false,
    formData.building || null,
    formData.roomNumber || null,
    formData.floor || null,
    formData.otherLocation || null,
    formData.staffInformed,
    formData.notificationTime,
    formData.teamResponding,
    formData.timeLeftClinic,
    formData.chwcVehicle || false,
    formData.sistersOnFoot || false,
    formData.otherTransport || false,
    formData.otherTransportDetail || null,
    formData.arrivalTime,
    formData.studentNumber,
    formData.patientName,
    formData.patientSurname,
    formData.primaryAssessment,
    formData.intervention,
    formData.medicalConsent,
    formData.transportConsent,
    formData.signature,
    formData.consentDate,
    formData.ptCHWCVehicle || false,
    formData.ptAmbulance || false,
    formData.ptOther || false,
    formData.ptOtherDetail || null,
    formData.patientTransportedTo,
    formData.departureTime,
    formData.chwcArrivalTime,
    formData.existingFile,
    formData.referred,
    formData.hospitalName || null,
    formData.dischargeCondition,
    formData.dischargeTime,
    id
  ];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('Database error updating emergency report:', err);
      return res.status(500).json({ 
        error: 'Failed to update emergency report',
        details: err.message 
      });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        error: 'Emergency report not found'
      });
    }
    
    res.status(200).json({ 
      message: 'Emergency report updated successfully!'
    });
  });
});

// Delete emergency report
app.delete('/api/emergency-report/:id', (req, res) => {
  const { id } = req.params;

  const sql = 'DELETE FROM emergency_onboarding WHERE id = ?';

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error('Database error deleting emergency report:', err);
      return res.status(500).json({ 
        error: 'Failed to delete emergency report',
        details: err.message 
      });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        error: 'Emergency report not found'
      });
    }
    
    res.status(200).json({ 
      message: 'Emergency report deleted successfully!'
    });
  });
});

// Report endpoints
app.get('/report', (req, res) => {
  res.sendFile(__dirname + '/public/reports.html');
});

// 🔹 Report 1: Appointments (Line Chart: Bookings vs Emergencies)
app.post('/report1', async (req, res) => {
  try {
    const connection = await db.promise().getConnection();

    const [rows] = await connection.execute(`
      SELECT 
          m.month,
          COALESCE(a.total_bookings, 0) AS total_bookings,
          COALESCE(p.total_emergencies, 0) AS total_emergencies
      FROM (
          SELECT DATE_FORMAT(appointment_date,'%M' ) AS month
          FROM appointments WHERE appointment_date IS NOT NULL
          UNION
          SELECT DATE_FORMAT(date,'%M ') AS month
          FROM emergency_onboarding WHERE date IS NOT NULL
      ) m
      LEFT JOIN (
          SELECT DATE_FORMAT(appointment_date,'%M ') AS month,
                 COUNT(*) AS total_bookings
          FROM appointments
          WHERE appointment_date IS NOT NULL
          GROUP BY DATE_FORMAT(appointment_date,'%M ')
      ) a ON m.month = a.month
      LEFT JOIN (
          SELECT DATE_FORMAT(date,'%M ') AS month,
                 COUNT(*) AS total_emergencies
          FROM emergency_onboarding
          WHERE date IS NOT NULL
          GROUP BY DATE_FORMAT(date,'%M ')
      ) p ON m.month = p.month
      ORDER BY STR_TO_DATE(m.month, '%M ')
    `);

    const labels = rows.map(r => r.month);
    const bookings = rows.map(r => r.total_bookings);
    const emergencies = rows.map(r => r.total_emergencies);

    const chartConfig = {
      type: "line",
      data: {
        labels,
        datasets: [
          { label: "Bookings", data: bookings, borderColor: "yellow", backgroundColor: "yellow", fill: false },
          { label: "Emergencies", data: emergencies, borderColor: "red", backgroundColor: "red", fill: false }
        ]
      },
      options: {
        scales: {
          x: { title: { display: true, text: "Month" }, ticks: { autoSkip: true, maxRotation: 0, minRotation: 0 } },
          y: { title: { display: true, text: "Count" }, beginAtZero: true }
        }
      }
    };
    const chartImage = await chartJSNodeCanvas.renderToBuffer(chartConfig);

    // PDF
    const doc = new PDFDocument({ margin: 30, size: "A4" });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=appointment.pdf");
    doc.pipe(res);

    doc.fontSize(20).text("Appointments Report", { align: "center" });
    doc.moveDown();
    doc.image(chartImage, { fit: [500, 300], align: "center" });
    doc.moveDown();

    drawTable(
      doc,
      ["Month", "Bookings", "Emergencies"],
      rows.map(r => [r.month, r.total_bookings, r.total_emergencies]),
      [50, 250, 400]
    );

    doc.end();
    await connection.release();
  } catch (err) {
    console.error(err);
    res.status(500).send("Error generating report1");
  }
});

// 🔹 Report 2: Emergencies (Pie Chart + Table)
app.post('/report2', async (req, res) => {
  try {
    const connection = await db.promise().getConnection();

    const [rows] = await connection.execute(`
      SELECT 
        SUM(education_campus) AS Parktown,
        SUM(other_campus) AS Main,
        COUNT(*) AS Total
      FROM emergency_onboarding
    `);

    const row = rows[0];

    const chartConfig = {
      type: "pie",
      data: {
        labels: ["Parktown", "Main"],
        datasets: [{ data: [row.Parktown || 0, row.Main || 0], backgroundColor: ["orange", "green"] }]
      }
    };
    const chartImage = await chartJSNodeCanvas.renderToBuffer(chartConfig);

    const doc = new PDFDocument({ margin: 30, size: "A4" });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=emergency.pdf");
    doc.pipe(res);

    doc.fontSize(20).text("Emergencies Report", { align: "center" });
    doc.moveDown();
    doc.image(chartImage, { fit: [400, 300], align: "center" });
    doc.moveDown();

    drawTable(
      doc,
      ["Parktown", "Main", "Total"],
      [[row.Parktown || 0, row.Main || 0, row.Total || 0]],
      [50, 250, 400]
    );

    doc.end();
    await connection.release();
  } catch (err) {
    console.error(err);
    res.status(500).send("Error generating report2");
  }
});

// 🔹 Report 3: POR Uploads vs Bookings (Line Chart + Table)
app.post('/report3', async (req, res) => {
  try {
    const connection = await db.promise().getConnection();

    const [rows] = await connection.execute(`
      SELECT 
        m.month,
        COALESCE(a.total_bookings, 0) AS total_bookings,
        COALESCE(p.total_uploads, 0) AS total_uploads
      FROM (
        SELECT DATE_FORMAT(appointment_date, '%M ') AS month
        FROM appointments WHERE appointment_date IS NOT NULL
        UNION
        SELECT DATE_FORMAT(uploaded_at, '%M ') AS month
        FROM por_uploads WHERE uploaded_at IS NOT NULL
      ) m
      LEFT JOIN (
        SELECT DATE_FORMAT(appointment_date, '%M ') AS month,
               COUNT(*) AS total_bookings
        FROM appointments
        WHERE appointment_date IS NOT NULL
        GROUP BY DATE_FORMAT(appointment_date, '%M ')
      ) a ON m.month = a.month
      LEFT JOIN (
        SELECT DATE_FORMAT(uploaded_at, '%M ') AS month,
               COUNT(*) AS total_uploads
        FROM por_uploads
        WHERE uploaded_at IS NOT NULL
        GROUP BY DATE_FORMAT(uploaded_at, '%M ')
      ) p ON m.month = p.month
      ORDER BY STR_TO_DATE(m.month, '%M ')
    `);

    const labels = rows.map(r => r.month);
    const uploads = rows.map(r => r.total_uploads);
    const bookings = rows.map(r => r.total_bookings);

    const chartConfig = {
      type: "line",
      data: {
        labels,
        datasets: [
          { 
            label: "POR Uploads", 
            data: uploads, 
            borderColor: "yellow", 
            backgroundColor: "yellow", 
            fill: false 
          },
          { 
            label: "Bookings", 
            data: bookings, 
            borderColor: "red", 
            backgroundColor: "red", 
            fill: false 
          }
        ]
      },
      options: {
        scales: {
          x: { title: { display: true, text: "Month" }, ticks: { autoSkip: true, maxRotation: 0, minRotation: 0 } },
          y: { title: { display: true, text: "Count" }, beginAtZero: true }
        }
      }
    };
    const chartImage = await chartJSNodeCanvas.renderToBuffer(chartConfig);

    const doc = new PDFDocument({ margin: 30, size: "A4" });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=POR.pdf");
    doc.pipe(res);

    doc.fontSize(20).text("Proof of Registration Uploads vs Bookings", { align: "center" });
    doc.moveDown();
    doc.image(chartImage, { fit: [500, 300], align: "center" });
    doc.moveDown();

    drawTable(
      doc,
      ["Month", "POR Uploads", "Bookings"],
      rows.map(r => [r.month, r.total_uploads, r.total_bookings]),
      [50, 250, 400]
    );

    doc.end();
    await connection.release();
  } catch (err) {
    console.error(err);
    res.status(500).send("Error generating report3");
  }
});

// Generate appointments report (PDF) - Updated with charts
app.post('/api/report1', async (req, res) => {
  try {
    const connection = await db.promise().getConnection();

    const [rows] = await connection.execute(`
      SELECT 
          m.month,
          COALESCE(a.total_bookings, 0) AS total_bookings,
          COALESCE(p.total_emergencies, 0) AS total_emergencies
      FROM (
          SELECT DATE_FORMAT(appointment_date,'%M %Y') AS month
          FROM appointments WHERE appointment_date IS NOT NULL
          UNION
          SELECT DATE_FORMAT(date,'%M %Y') AS month
          FROM emergency_onboarding WHERE date IS NOT NULL
      ) m
      LEFT JOIN (
          SELECT DATE_FORMAT(appointment_date,'%M %Y') AS month,
                 COUNT(*) AS total_bookings
          FROM appointments
          WHERE appointment_date IS NOT NULL
          GROUP BY DATE_FORMAT(appointment_date,'%M %Y')
      ) a ON m.month = a.month
      LEFT JOIN (
          SELECT DATE_FORMAT(date,'%M %Y') AS month,
                 COUNT(*) AS total_emergencies
          FROM emergency_onboarding
          WHERE date IS NOT NULL
          GROUP BY DATE_FORMAT(date,'%M %Y')
      ) p ON m.month = p.month
      ORDER BY STR_TO_DATE(m.month, '%M %Y')
      LIMIT 20
    `);

    const labels = rows.map(r => r.month);
    const bookings = rows.map(r => r.total_bookings);
    const emergencies = rows.map(r => r.total_emergencies);

    const chartConfig = {
      type: "line",
      data: {
        labels,
        datasets: [
          { label: "Bookings", data: bookings, borderColor: "yellow", backgroundColor: "yellow", fill: false },
          { label: "Emergencies", data: emergencies, borderColor: "red", backgroundColor: "red", fill: false }
        ]
      },
      options: {
        scales: {
          x: { title: { display: true, text: "Month" }, ticks: { autoSkip: true, maxRotation: 0, minRotation: 0 } },
          y: { title: { display: true, text: "Count" }, beginAtZero: true }
        }
      }
    };
    const chartImage = await chartJSNodeCanvas.renderToBuffer(chartConfig);

    // PDF
    const doc = new PDFDocument({ margin: 30, size: "A4" });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=appointment.pdf");
    doc.pipe(res);

    doc.fontSize(20).text("Appointments Report", { align: "center" });
    doc.moveDown();
    doc.image(chartImage, { fit: [500, 300], align: "center" });
    doc.moveDown();

    drawTable(
      doc,
      ["Month", "Bookings", "Emergencies"],
      rows.map(r => [r.month, r.total_bookings, r.total_emergencies]),
      [50, 250, 400]
    );

    doc.end();
    await connection.release();
  } catch (err) {
    console.error(err);
    res.status(500).send("Error generating report1");
  }
});

// Generate emergency report (PDF) - Updated with charts
app.post('/api/report2', async (req, res) => {
  try {
    const connection = await db.promise().getConnection();

    const [rows] = await connection.execute(`
      SELECT 
        SUM(education_campus) AS Parktown,
        SUM(other_campus) AS Main,
        COUNT(*) AS Total
      FROM emergency_onboarding
    `);

    const row = rows[0];

    const chartConfig = {
      type: "pie",
      data: {
        labels: ["Parktown", "Main"],
        datasets: [{ data: [row.Parktown || 0, row.Main || 0], backgroundColor: ["orange", "green"] }]
      }
    };
    const chartImage = await chartJSNodeCanvas.renderToBuffer(chartConfig);

    const doc = new PDFDocument({ margin: 30, size: "A4" });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=emergency.pdf");
    doc.pipe(res);

    doc.fontSize(20).text("Emergencies Report", { align: "center" });
    doc.moveDown();
    doc.image(chartImage, { fit: [400, 300], align: "center" });
    doc.moveDown();

    drawTable(
      doc,
      ["Parktown", "Main", "Total"],
      [[row.Parktown || 0, row.Main || 0, row.Total || 0]],
      [50, 250, 400]
    );

    doc.end();
    await connection.release();
  } catch (err) {
    console.error(err);
    res.status(500).send("Error generating report2");
  }
});

// Generate POR report (PDF) - Updated with charts
app.post('/api/report3', async (req, res) => {
  try {
    const connection = await db.promise().getConnection();

    const [rows] = await connection.execute(`
      SELECT 
        m.month,
        COALESCE(a.total_bookings, 0) AS total_bookings,
        COALESCE(p.total_uploads, 0) AS total_uploads
      FROM (
        SELECT DATE_FORMAT(appointment_date, '%M %Y') AS month
        FROM appointments WHERE appointment_date IS NOT NULL
        UNION
        SELECT DATE_FORMAT(uploaded_at, '%M %Y') AS month
        FROM por_uploads WHERE uploaded_at IS NOT NULL
      ) m
      LEFT JOIN (
        SELECT DATE_FORMAT(appointment_date, '%M %Y') AS month,
               COUNT(*) AS total_bookings
        FROM appointments
        WHERE appointment_date IS NOT NULL
        GROUP BY DATE_FORMAT(appointment_date, '%M %Y')
      ) a ON m.month = a.month
      LEFT JOIN (
        SELECT DATE_FORMAT(uploaded_at, '%M %Y') AS month,
               COUNT(*) AS total_uploads
        FROM por_uploads
        WHERE uploaded_at IS NOT NULL
        GROUP BY DATE_FORMAT(uploaded_at, '%M %Y')
      ) p ON m.month = p.month
      ORDER BY STR_TO_DATE(m.month, '%M %Y')
    `);

    const labels = rows.map(r => r.month);
    const uploads = rows.map(r => r.total_uploads);
    const bookings = rows.map(r => r.total_bookings);

    const chartConfig = {
      type: "line",
      data: {
        labels,
        datasets: [
          { 
            label: "POR Uploads", 
            data: uploads, 
            borderColor: "yellow", 
            backgroundColor: "yellow", 
            fill: false 
          },
          { 
            label: "Bookings", 
            data: bookings, 
            borderColor: "red", 
            backgroundColor: "red", 
            fill: false 
          }
        ]
      },
      options: {
        scales: {
          x: { title: { display: true, text: "Month" }, ticks: { autoSkip: true, maxRotation: 0, minRotation: 0 } },
          y: { title: { display: true, text: "Count" }, beginAtZero: true }
        }
      }
    };
    const chartImage = await chartJSNodeCanvas.renderToBuffer(chartConfig);

    const doc = new PDFDocument({ margin: 30, size: "A4" });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=POR.pdf");
    doc.pipe(res);

    doc.fontSize(20).text("Proof of Registration Uploads vs Bookings", { align: "center" });
    doc.moveDown();
    doc.image(chartImage, { fit: [500, 300], align: "center" });
    doc.moveDown();

    drawTable(
      doc,
      ["Month", "POR Uploads", "Bookings"],
      rows.map(r => [r.month, r.total_uploads, r.total_bookings]),
      [50, 250, 400]
    );

    doc.end();
    await connection.release();
  } catch (err) {
    console.error(err);
    res.status(500).send("Error generating report3");
  }
});

// API Endpoint: Get onboarding data for reports
app.get('/api/onboarding-data', (req, res) => {
  const { from, to, role } = req.query;
  
  let sql = `
    SELECT 
      id,
      student_number as id,
      CONCAT(surname, ', ', full_names) as name,
      'Student' as role,
      DATE_FORMAT(date, '%Y-%m-%d') as date
    FROM onboarding_students
    WHERE 1=1
  `;
  
  const params = [];
  
  if (from) {
    sql += ' AND DATE(date) >= ?';
    params.push(from);
  }
  
  if (to) {
    sql += ' AND DATE(date) <= ?';
    params.push(to);
  }
  
  sql += ' ORDER BY date DESC';
  
  db.query(sql, params, (err, results) => {
    if (err) {
      console.error('Database error fetching onboarding data:', err);
      return res.status(500).json({ 
        error: 'Failed to fetch onboarding data',
        details: err.message 
      });
    }
    
    res.status(200).json(results);
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
  console.log(`- POST /api/login (UPDATED for student login with status)`);
  console.log(`- POST /api/check-onboarding`);
  console.log(`- POST /api/check-por (NEW)`);
  console.log(`- POST /api/upload-por`);
  console.log(`- POST /api/save-appointment (UPDATED for student number)`);
  console.log(`- GET /api/student-appointments/:studentNumber (FIXED)`);
  console.log(`- GET /api/appointments (UPDATED for student number)`);
  console.log(`- GET /api/appointments/student/:studentNumber (NEW - for modify booking)`);
  console.log(`- PUT /api/appointments/:id (NEW - update appointment)`);
  console.log(`- PUT /api/appointments/:id/cancel (NEW - cancel appointment)`);
  console.log(`- POST /api/reset-passwords (for development)`);
  console.log(`- POST /api/debug-user`);
  console.log(`- GET /api/users`);
  console.log(`- GET /api/students (NEW)`);
  console.log(`- GET /api/por-uploads`);
  console.log(`- POST /api/create-por-table (for development)`);
  console.log(`- POST /api/create-appointments-table (NEW - for development)`);
  console.log(`- POST /api/create-students-table (NEW)`);
  console.log(`- POST /api/update-appointments-table (NEW)`);
  console.log(`- POST /api/onboarding`);
  console.log(`- POST /api/create-student (NEW)`);
  console.log(`- POST /api/reset-student-password (NEW)`);
  console.log(`- POST /api/save-staff-schedule`);
  console.log(`- GET /api/today-staff-schedule`);
  console.log(`- POST /api/create-emergency-table (for development)`);
  console.log(`- POST /api/emergency-onboarding`);
  console.log(`- GET /api/emergency-reports`);
  console.log(`- GET /api/emergency-report/:id`);
  console.log(`- PUT /api/emergency-report/:id`);
  console.log(`- DELETE /api/emergency-report/:id`);
  console.log(`- GET /report (NEW - Reports Dashboard)`);
  console.log(`- POST /report1 (NEW - Appointments PDF Report with Charts)`);
  console.log(`- POST /report2 (NEW - Emergency PDF Report with Charts)`);
  console.log(`- POST /report3 (NEW - POR PDF Report with Charts)`);
  console.log(`- POST /api/report1 (UPDATED - Appointments PDF Report with Charts)`);
  console.log(`- POST /api/report2 (UPDATED - Emergency PDF Report with Charts)`);
  console.log(`- POST /api/report3 (UPDATED - POR PDF Report with Charts)`);
  console.log(`- GET /api/onboarding-data (NEW - New Registrations Report Data)`);
});