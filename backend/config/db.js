require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host:               process.env.DB_HOST,
  port:               Number(process.env.DB_PORT),
  user:               process.env.DB_USER,
  password:           process.env.DB_PASSWORD,
  database:           process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit:    10,
  charset:            'utf8mb4',
});

async function testConnection() {
  const conn = await pool.getConnection();
  console.log('✅ MySQL connecté — base:', process.env.DB_NAME);
  conn.release();
}

module.exports = { pool, testConnection };