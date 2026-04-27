import nodemailer from 'nodemailer';
import { db } from './db.js';
import dotenv from 'dotenv';

dotenv.config(); // ← removed .env.local

// Create transporter with email service configuration
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '465'),
  secure: true, // ← always true for port 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Test connection on startup
(async () => {
  try {
    await transporter.verify();
    console.log('✅ Email service is connected and ready');
  } catch (error) {
    console.error('❌ Email service connection failed:', error.message);
    console.error('   Check your EMAIL_HOST, EMAIL_PORT, EMAIL_USER, and EMAIL_PASS in Railway Variables');
  }
})();

export async function sendReportEmail(reportData) {
  try {
    let authorityEmail = reportData.authorityEmail || process.env.AUTHORITY_EMAIL || 'authority@example.com';
    const authorityName = reportData.authorityName || 'Authority';
    
    if (!reportData.authorityEmail && reportData.authorityId) {
      try {
        const [authority] = await db.execute(
          'SELECT Email, Agency_Name FROM authority WHERE AuthorityID = ?',
          [reportData.authorityId]
        );
        if (authority.length > 0) {
          authorityEmail = authority[0].Email;
        }
      } catch (dbError) {
        console.warn('Could not fetch authority email from database:', dbError.message);
      }
    }

    const submissionTime = new Date().toLocaleString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit'
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: authorityEmail,
      subject: reportData.subject || `New Report Submitted - ${submissionTime}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Report Received</h2>
          <p>Dear ${authorityName},</p>
          <p>A new report has been submitted to your authority:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="background: #f5f5f5;">
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Report ID:</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${reportData.reportId || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Title:</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${reportData.title || 'N/A'}</td>
            </tr>
            <tr style="background: #f5f5f5;">
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Description:</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${reportData.description || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Submitted:</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${submissionTime}</td>
            </tr>
          </table>
          <p>Please log in to your dashboard to review and respond to this report.</p>
          <p>Best regards,<br/>Citizen Report System</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Failed to send email:', error.message);
    return false;
  }
}