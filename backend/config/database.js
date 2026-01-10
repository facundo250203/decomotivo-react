const mysql = require('mysql2');
const dotenv = require('dotenv');

dotenv.config();

// ============================================
// POOL DE CONEXIONES MYSQL
// ============================================
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Promisify para usar async/await
const promisePool = pool.promise();

// ============================================
// FUNCIÓN PARA PROBAR LA CONEXIÓN
// ============================================
const testConnection = async () => {
  try {
    const connection = await promisePool.getConnection();
    console.log('✅ Conexión exitosa a MySQL');
    console.log(`📦 Base de datos: ${process.env.DB_NAME}`);
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Error conectando a MySQL:', error.message);
    return false;
  }
};

// Probar conexión al iniciar
testConnection();

// ============================================
// EXPORTAR
// ============================================
module.exports = {
  pool,
  promisePool,
  testConnection
};