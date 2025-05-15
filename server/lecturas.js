// lectura.js
const db = require('../db/database'); // Importar la base de datos
// Consulta y muestra todos los datos
db.all('SELECT * FROM datos_sensores ORDER BY timestamp DESC LIMIT 10', (err, rows) => {
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
