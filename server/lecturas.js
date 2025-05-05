// lectura.js
const sqlite3 = require('sqlite3').verbose();

// Conecta a la base de datos
const db = new sqlite3.Database('./sensores.db', (err) => {
  if (err) {
    return console.error('❌ Error al conectar con SQLite:', err.message);
  }
  console.log('✅ Conectado a la base de datos SQLite');
});

// Consulta y muestra todos los datos
db.all('SELECT * FROM datos_sensores ORDER BY timestamp DESC', (err, rows) => {
  if (err) {
    return console.error('❌ Error al leer datos:', err.message);
  }

  if (rows.length === 0) {
    console.log('⚠️ No hay datos en la base de datos.');
  } else {
    console.log('📋 Datos en la base de datos:\n');
    rows.forEach((row) => {
      console.log(row);
    });
  }

  db.close();
});
