// dbconfig.js for XAMPP MySQL
require('dotenv').config();
const mysql = require('mysql2');

const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',  // XAMPP default is empty password
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || '3306'),
  ssl: false,  // XAMPP MySQL typically doesn't use SSL
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test connection
db.getConnection((err, connection) => {
  if (err) {
    console.error('Error connecting to XAMPP MySQL:', err);
    return;
  }
  console.log('Successfully connected to XAMPP MySQL');
  connection.release();
});

module.exports = db;