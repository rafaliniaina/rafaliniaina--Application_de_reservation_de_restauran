require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4',

  // ✅ SSL obligatoire pour TiDB Cloud
  ssl: {
    rejectUnauthorized: true,
    ca: process.env.DB_SSL_CA || undefined // optionnel si tu as le certificat
  }
});

async function testConnection() {
  try {
    const conn = await pool.getConnection();

    // ✅ test réel
    await conn.query("SELECT 1");

    console.log('✅ TiDB/MySQL connecté — base:', process.env.DB_NAME);

    conn.release();
    return true;
  } catch (error) {
    console.error("❌ Connexion TiDB/MySQL échouée :", error.message);
    return false;
  }
}

module.exports = { pool, testConnection };
