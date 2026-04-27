import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config(); // ← remove the .env.local path

export const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306, // ← add port
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'crs',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});