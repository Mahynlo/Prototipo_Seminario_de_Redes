const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../sensores.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error al conectar con SQLite:', err.message);
  } else {
    console.log('✅ Conectado a la base de datos SQLite');
  }
});

// Crear tabla de datos de sensores si no existe
db.run(`
  CREATE TABLE IF NOT EXISTS datos_sensores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    humedad REAL,
    temperatura REAL,
    indice_calor REAL,
    valor_luz REAL,
    humedad_suelo REAL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Crear tabla de alertas si no existe
db.run(`
  CREATE TABLE IF NOT EXISTS alertas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sensor TEXT,
    mensaje TEXT,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

module.exports = db;

