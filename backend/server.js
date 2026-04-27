import fs from 'fs';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { db } from './lib/db.js';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { OAuth2Client } from 'google-auth-library';
import { sendReportEmail } from './lib/email.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Set up file uploads directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const upload = multer({
  dest: uploadsDir,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Allow any file type for now
    cb(null, true);
  }
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Initialize Google OAuth Client
const googleClient = new OAuth2Client();

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

// ============= LOGIN ROUTE =============
const validateEmail = (email) => {
  const emailRegex = /^[a-zA-Z0-9._+%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email.toLowerCase());
};

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Email is required' });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address' });
    }

    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    if (password.length > 128) {
      return res.status(400).json({ error: 'Password must not exceed 128 characters' });
    }

    console.log("=== LOGIN ATTEMPT ===");
    console.log("Email:", email);

    const [users] = await db.execute(
      'SELECT UserID, full_name AS Full_Name, Email AS email, Password AS password FROM `user` WHERE Email = ? OR email = ?',
      [email, email]
    );

    if (users.length === 0) {
      console.log("❌ No user found with email:", email);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = users[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      console.log("❌ Password mismatch for email:", email);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    console.log("✅ Login successful for user:", user.Full_Name);
    res.json({
      message: "Login successful",
      userId: user.UserID,
      fullName: user.Full_Name,
      email: user.email
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============= GOOGLE LOGIN ROUTE =============
app.post('/api/google-login', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      console.warn('⚠️ No token provided in request');
      return res.status(400).json({ error: 'Token is required' });
    }

    console.log("🔍 Verifying Google token...");
    const clientId = '862494866742-0sb0mvdcjuidrvi9sq7k28lkb8mcap4a.apps.googleusercontent.com';
    console.log("📋 Client ID:", clientId);
    console.log("🔐 Token length:", token.length);

    // Verify the Google token
    let ticket;
    try {
      ticket = await googleClient.verifyIdToken({
        idToken: token,
        audience: clientId
      });
      console.log("✅ Token verified successfully");
    } catch (verifyError) {
      console.error("❌ Token verification failed:", verifyError.message);
      console.error("Verify error code:", verifyError.code);
      console.error("Verify error details:", verifyError);
      return res.status(401).json({ error: 'Token verification failed: ' + verifyError.message });
    }

    const payload = ticket.getPayload();
    const googleId = payload.sub;
    const email = payload.email;
    const fullName = payload.name || email.split('@')[0];
    const picture = payload.picture;

    console.log("✅ Google Token verified for:", email);
    console.log("👤 Full Name:", fullName);
    console.log("🔑 Google ID:", googleId);

    // Check if user exists
    let existingUsers;
    try {
      [existingUsers] = await db.execute(
        'SELECT UserID, Full_Name, Email, Contact_Number FROM user WHERE Email = ?',
        [email]
      );
      console.log("📊 Database query successful, found", existingUsers.length, "user(s)");
    } catch (dbError) {
      console.error("❌ Database query failed:", dbError.message);
      return res.status(500).json({ error: 'Database error: ' + dbError.message });
    }

    let user;
    if (existingUsers.length > 0) {
      // User exists, return their info
      user = existingUsers[0];
      console.log("✅ Existing user logged in via Google:", fullName);
    } else {
      // Create new user from Google data
      try {
        const hashedPassword = await bcrypt.hash(Math.random().toString(36).slice(-15), 10);
        const username = email.split('@')[0] + '_' + Math.random().toString(36).slice(2, 6);
        
        console.log("🆕 Creating new user...");
        console.log("  Username:", username);
        console.log("  Email:", email);
        console.log("  Full Name:", fullName);
        
        const [insertResult] = await db.execute(
          'INSERT INTO user (Full_Name, Email, Username, Password) VALUES (?, ?, ?, ?)',
          [fullName, email, username, hashedPassword]
        );

        user = {
          UserID: insertResult.insertId,
          Full_Name: fullName,
          Email: email,
          Contact_Number: null
        };
        console.log("✅ New user created via Google, ID:", user.UserID);
      } catch (insertError) {
        console.error("❌ User creation failed:", insertError.message);
        console.error("Insert error code:", insertError.code);
        return res.status(500).json({ error: 'User creation failed: ' + insertError.message });
      }
    }

    console.log("📦 Sending response with user data...");
    res.json({
      message: 'Google login successful',
      user: {
        UserID: user.UserID,
        Full_Name: user.Full_Name,
        Email: user.Email,
        Contact_Number: user.Contact_Number
      }
    });
  } catch (error) {
    console.error("❌ Google login error (catch block):", error.message);
    console.error("Error stack:", error.stack);
    res.status(401).json({ error: 'Invalid token or Google login failed: ' + error.message });
  }
});

// ============= SIGNUP ROUTE =============
app.post('/api/signup', async (req, res) => {
  try {
    const { email, password, full_name } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Email is required' });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address' });
    }

    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    if (!full_name || !full_name.trim()) {
      return res.status(400).json({ error: 'Full name is required' });
    }

    const [existing] = await db.execute(
      'SELECT UserID FROM `user` WHERE Email = ?',
      [email]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.execute(
      'INSERT INTO `user` (Email, Password, full_name, created_at) VALUES (?, ?, ?, NOW())',
      [email, hashedPassword, full_name]
    );

    res.json({ message: 'Signup successful. You can now login.' });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============= FORGOT PASSWORD ROUTE =============
app.post('/api/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !validateEmail(email)) {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    const [users] = await db.execute(
      'SELECT UserID, Email FROM `user` WHERE Email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'No account found with this email' });
    }

    const resetToken = Math.random().toString(36).substring(2, 15) + 
                      Math.random().toString(36).substring(2, 15);
    
    await db.execute(
      'UPDATE `user` SET reset_token = ?, reset_token_expires = DATE_ADD(NOW(), INTERVAL 1 HOUR) WHERE UserID = ?',
      [resetToken, users[0].UserID]
    );

    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    await sendReportEmail({
      authorityEmail: email,
      authorityName: 'User',
      subject: 'Password Reset Request',
      message: `Click the link below to reset your password:\n\n${resetLink}\n\nThis link expires in 1 hour.`
    });

    res.json({ message: 'Password reset link sent to your email' });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============= RESET PASSWORD ROUTE =============
app.post('/api/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password || password.length < 8) {
      return res.status(400).json({ error: 'Valid token and password (8+ characters) required' });
    }

    const [users] = await db.execute(
      'SELECT UserID FROM `user` WHERE reset_token = ? AND reset_token_expires > NOW()',
      [token]
    );

    if (users.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.execute(
      'UPDATE `user` SET Password = ?, reset_token = NULL, reset_token_expires = NULL WHERE UserID = ?',
      [hashedPassword, users[0].UserID]
    );

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============= REPORT ROUTES =============
app.post('/api/report', upload.single('evidence'), async (req, res) => {
  try {
    const { userId, isAnonymous, title, description, category } = req.body;
    const authorityId = req.body.authorityId && req.body.authorityId !== '' ? req.body.authorityId : null;

    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }

    let evidencePath = null;
    if (req.file) {
      evidencePath = `/uploads/${req.file.filename}`;
    }

    const [result] = await db.execute(
      'INSERT INTO report (Incident_Description, Is_Anonymous, Incident_Type, AuthorityID, Status, Evidence_URL, UserID) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [description, isAnonymous ? 1 : 0, category || 'general', authorityId, 'Pending', evidencePath, userId]
    );

    const reportId = result.insertId;

    // Only send email if authority was selected
    if (authorityId) {
      const [authority] = await db.execute(
        'SELECT Email, Agency_Name FROM authority WHERE AuthorityID = ?',
        [authorityId]
      );

      if (authority.length > 0) {
        await sendReportEmail({ 
          authorityEmail: authority[0].Email,
          authorityName: authority[0].Agency_Name,
          title: title,
          description: description,
          reportId: reportId
        });
      }
    }

    res.json({ message: 'Report submitted successfully', reportId });
  } catch (error) {
    console.error("Report submission error:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/reports', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const [reports] = await db.execute(
      'SELECT ReportID as id, Incident_Description as description, Incident_Type as type, Status as status, Date_Submitted as created_at FROM report WHERE UserID = ? ORDER BY Date_Submitted DESC',
      [userId]
    );
    res.json(reports);
  } catch (error) {
    console.error("Fetch reports error:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/reports/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [reports] = await db.execute(
      'SELECT ReportID as id, Incident_Description as description, Incident_Type as type, Status as status, Date_Submitted as created_at, Evidence_URL, UserID, AuthorityID, Is_Anonymous FROM report WHERE ReportID = ?',
      [id]
    );

    if (reports.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json(reports[0]);
  } catch (error) {
    console.error("Fetch report error:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============= AUTHORITY ROUTES =============
app.get('/api/authority', async (req, res) => {
  try {
    const { userId } = req.query;
    let query = 'SELECT AuthorityID, Agency_Name, Email, Contact_Person, Phone FROM authority';
    const params = [];
    
    if (userId) {
      query += ' WHERE user_id = ?';
      params.push(userId);
    }
    
    const [authorities] = await db.execute(query, params);
    res.json(authorities);
  } catch (error) {
    console.error("Fetch authorities error:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/authority/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [authority] = await db.execute(
      'SELECT * FROM authority WHERE AuthorityID = ?',
      [id]
    );

    if (authority.length === 0) {
      return res.status(404).json({ error: 'Authority not found' });
    }

    res.json(authority[0]);
  } catch (error) {
    console.error("Fetch authority error:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/authority', async (req, res) => {
  try {
    const { agencyName, email, contactPerson, phone, userId } = req.body;
    
    if (!agencyName || !email) {
      return res.status(400).json({ error: 'Agency name and email are required' });
    }
    
    const [result] = await db.execute(
      'INSERT INTO authority (Agency_Name, Email, Contact_Person, Phone, user_id) VALUES (?, ?, ?, ?, ?)',
      [agencyName, email, contactPerson || null, phone || null, userId]
    );
    
    res.status(201).json({ 
      AuthorityID: result.insertId,
      Agency_Name: agencyName,
      Email: email,
      Contact_Person: contactPerson,
      Phone: phone
    });
  } catch (error) {
    console.error("Create authority error:", error);
    res.status(500).json({ error: 'Failed to create authority' });
  }
});

app.put('/api/authority/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { agencyName, email, contactPerson, phone } = req.body;
    
    if (!agencyName || !email) {
      return res.status(400).json({ error: 'Agency name and email are required' });
    }
    
    await db.execute(
      'UPDATE authority SET Agency_Name = ?, Email = ?, Contact_Person = ?, Phone = ? WHERE AuthorityID = ?',
      [agencyName, email, contactPerson || null, phone || null, id]
    );
    
    res.json({ 
      AuthorityID: id,
      Agency_Name: agencyName,
      Email: email,
      Contact_Person: contactPerson,
      Phone: phone
    });
  } catch (error) {
    console.error("Update authority error:", error);
    res.status(500).json({ error: 'Failed to update authority' });
  }
});

app.delete('/api/authority/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await db.execute('DELETE FROM authority WHERE AuthorityID = ?', [id]);
    
    res.json({ message: 'Authority deleted successfully' });
  } catch (error) {
    console.error("Delete authority error:", error);
    res.status(500).json({ error: 'Failed to delete authority' });
  }
});

// ============= SETTINGS ROUTE =============
app.get('/api/settings', async (req, res) => {
  try {
    res.json({ 
      theme: 'light',
      language: 'en',
      notifications: true 
    });
  } catch (error) {
    console.error("Settings error:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/settings', async (req, res) => {
  try {
    const { userId, firstName, lastName, email, phone, password } = req.body;
    
    if (!userId || !email) {
      return res.status(400).json({ error: 'User ID and email are required' });
    }
    
    let updateQuery = 'UPDATE user SET Full_Name = ?, Email = ?, Contact_Number = ? WHERE UserID = ?';
    const params = [`${firstName} ${lastName}`, email, phone || null, userId];
    
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateQuery = 'UPDATE user SET Full_Name = ?, Email = ?, Contact_Number = ?, Password = ? WHERE UserID = ?';
      params.splice(3, 0, hashedPassword);
    }
    
    await db.execute(updateQuery, params);
    
    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error("Update settings error:", error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

app.post('/api/fix', async (req, res) => {
  try {
    const { reportId, authorityId, userId } = req.body;
    
    if (!reportId || !authorityId) {
      return res.status(400).json({ error: 'Report ID and Authority ID are required' });
    }
    
    // Update report to mark it as forwarded to authority
    await db.execute(
      'UPDATE report SET AuthorityID = ?, Status = "forwarded" WHERE ReportID = ?',
      [authorityId, reportId]
    );
    
    // Get report and authority details for email
    const [report] = await db.execute(
      'SELECT Incident_Description as description, Incident_Type as title FROM report WHERE ReportID = ?',
      [reportId]
    );
    
    const [authority] = await db.execute(
      'SELECT Email, Agency_Name FROM authority WHERE AuthorityID = ?',
      [authorityId]
    );
    
    if (report.length > 0 && authority.length > 0) {
      try {
        await sendReportEmail({
          authorityEmail: authority[0].Email,
          authorityName: authority[0].Agency_Name,
          reportTitle: report[0].title,
          reportDescription: report[0].description,
          reportId: reportId
        });
      } catch (emailError) {
        console.warn('Email notification failed:', emailError.message);
        // Don't fail the request if email fails
      }
    }
    
    res.json({ message: 'Report forwarded successfully' });
  } catch (error) {
    console.error("Forward report error:", error);
    res.status(500).json({ error: 'Failed to forward report' });
  }
});

// ============= ERROR HANDLING =============
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({ error: 'Internal server error' });
});

// ============= START SERVER =============
app.listen(PORT, () => {
  console.log(`✅ Backend server running on http://localhost:${PORT}`);
  console.log(`   API endpoints ready at http://localhost:${PORT}/api/*`);
});
