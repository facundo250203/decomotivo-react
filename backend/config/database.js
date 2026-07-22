const mysql = require("mysql2");
const dotenv = require("dotenv");

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
  charset: "utf8mb4",
  // "-03:00" le dice al driver cómo INTERPRETAR los DATETIME que ya vienen
  // de la sesión de MySQL (ver el SET time_zone de más abajo, que es quien
  // realmente fija en qué hora se evalúan CURRENT_TIMESTAMP/NOW()). Este
  // valor tiene que coincidir siempre con ese SET, nunca se cambia sin
  // cambiar el otro.
  timezone: "-03:00",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

// Fija la zona horaria de la SESIÓN de MySQL en -03:00 (Argentina) en cada
// conexión del pool, sin importar qué zona horaria tenga configurada el
// sistema operativo del servidor donde corra MySQL (acá coincide con el
// reloj de esta máquina, pero en un hosting como Hostinger el SO de la base
// puede venir en UTC por defecto). Sin este SET explícito, CURRENT_TIMESTAMP/
// NOW() se evaluarían con el time_zone=SYSTEM del hosting (probablemente
// UTC), y quedarían desalineados con el "-03:00" de arriba otra vez -- el
// mismo bug, con otro signo.
pool.on("connection", (connection) => {
  connection.query("SET time_zone = '-03:00'");
});

// Promisify para usar async/await
const promisePool = pool.promise();

// ============================================
// FUNCIÓN PARA PROBAR LA CONEXIÓN
// ============================================
const testConnection = async () => {
  try {
    const connection = await promisePool.getConnection();
    console.log("✅ Conexión exitosa a MySQL");
    console.log(`📦 Base de datos: ${process.env.DB_NAME}`);
    connection.release();
    return true;
  } catch (error) {
    console.error("❌ Error conectando a MySQL:", error.message);
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
  testConnection,
};
