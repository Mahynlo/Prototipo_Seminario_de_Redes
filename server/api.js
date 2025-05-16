//api.js
const express = require('express');
const router = express.Router(); // Importar router de express para crear rutas a la API
const db = require('../db/database'); // Importar la base de datos

// Ruta para obtener todos los datos históricos
router.get('/sensores', (req, res) => {
  db.all('SELECT * FROM datos_sensores ORDER BY timestamp DESC', (err, rows) => {
    if (err) {
      console.error('❌ Error al leer datos:', err.message);
      return res.status(500).json({ error: 'Error al leer datos' });
    }
    res.json(rows);
  });
});

//ruta para obtener el dato mas reciente
router.get('/sensores/ultimo', (req, res) => {
  db.get('SELECT * FROM datos_sensores ORDER BY timestamp DESC LIMIT 1', (err, row) => {
    if (err) {
      console.error('❌ Error al leer datos:', err.message);
      return res.status(500).json({ error: 'Error al leer datos' });
    }
    if (!row) {
      return res.status(404).json({ error: 'No hay datos disponibles' });
    }
    res.json(row);
  });
});

// 👉 Ruta para obtener historial de alertas
router.get('/alertasArduino', (req, res) => {
  db.all('SELECT * FROM alertasArduino ORDER BY id DESC', (err, rows) => {
    if (err) {
      console.error('❌ Error al consultar alertas:', err.message);
      return res.status(500).json({ error: 'Error al consultar alertas' });
    }
    res.json(rows);
  });
});

// alerta de planta
router.get('/alertasPlanta', (req, res) => {
  db.all('SELECT * FROM alertasPlanta', (err, rows) => {
    if (err) {
      console.error('❌ Error al consultar alertas:', err.message);
      return res.status(500).json({ error: 'Error al consultar alertas' });
    }
    res.json(rows);
  });
});


router.get('/alertasApp', (req, res) => {
  const { tipo, fecha, desde, hasta } = req.query;

  let condiciones = [];
  let parametros = [];

  let baseQuery = '';

  if (tipo === 'arduino') {
    baseQuery = 'SELECT fecha, sensor, mensaje FROM alertasArduino';
    if (fecha) {
      condiciones.push('date(fecha) = date(?)');
      parametros.push(fecha);
    }
    if (desde && hasta) {
      condiciones.push('date(fecha) BETWEEN date(?) AND date(?)');
      parametros.push(desde, hasta);
    }
  } else if (tipo === 'planta') {
    baseQuery = 'SELECT fecha, planta AS sensor, mensajes AS mensaje FROM alertasPlanta';
    if (fecha) {
      condiciones.push('date(fecha) = date(?)');
      parametros.push(fecha);
    }
    if (desde && hasta) {
      condiciones.push('date(fecha) BETWEEN date(?) AND date(?)');
      parametros.push(desde, hasta);
    }
  } else {
    // Consulta combinada
    baseQuery = `
      SELECT fecha, sensor, mensaje FROM alertasArduino
      UNION ALL
      SELECT fecha, planta AS sensor, mensajes AS mensaje FROM alertasPlanta
    `;
    if (fecha) {
      condiciones.push('date(fecha) = date(?)');
      parametros.push(fecha);
    }
    if (desde && hasta) {
      condiciones.push('date(fecha) BETWEEN date(?) AND date(?)');
      parametros.push(desde, hasta);
    }
  }

  let where = condiciones.length ? ' WHERE ' + condiciones.join(' AND ') : '';
  let finalQuery = `${baseQuery}${where} ORDER BY fecha DESC`;

  db.all(finalQuery, parametros, (err, rows) => {
    if (err) {
      console.error('❌ Error al consultar alertas:', err.message);
      return res.status(500).json({ error: 'Error al consultar alertas' });
    }
    res.json(rows);
  });
});



// registrar planta
router.post('/plantas', (req, res) => {
  const {
    nombre,
    humedad_min,
    humedad_max,
    temperatura_min,
    temperatura_max,
    nivel_luz,
    humedad_suelo_min,
    humedad_suelo_max
  } = req.body;

  if (
    !nombre || !nivel_luz ||
    isNaN(humedad_min) || isNaN(humedad_max) ||
    isNaN(temperatura_min) || isNaN(temperatura_max) ||
    isNaN(humedad_suelo_min) || isNaN(humedad_suelo_max)
  ) {
    return res.status(400).json({ error: 'Datos inválidos o faltantes' });
  }

  const query = `
    INSERT INTO plantas (
      nombre, humedad_min, humedad_max, temperatura_min, temperatura_max,
      nivel_luz, humedad_suelo_min, humedad_suelo_max
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(query, [
    nombre,
    parseFloat(humedad_min),
    parseFloat(humedad_max),
    parseFloat(temperatura_min),
    parseFloat(temperatura_max),
    nivel_luz,
    parseFloat(humedad_suelo_min),
    parseFloat(humedad_suelo_max)
  ], function (err) {
    if (err) {
      console.error('❌ Error al insertar planta:', err.message);
      res.status(500).json({ error: 'Error al guardar la planta', details: err.message });
    } else {
      console.log(`✅ Planta guardada con ID ${this.lastID}`);
      res.status(201).json({ message: 'Planta guardada correctamente', id: this.lastID });
    }
  });
});


//HACER FETCH A LA ULTIMA FILA
router.get('/plantas/ultima', (req, res) => {
  db.get('SELECT * FROM plantas ORDER BY id DESC LIMIT 1', (err, row) => {
    if (err) {
      console.error('❌ Error al obtener la última planta:', err.message);
      return res.status(500).json({ error: 'Error al consultar la base de datos' });
    }
    if (!row) {
      return res.status(404).json({ error: 'No hay plantas registradas' });
    }
    res.json(row);
  });
});


//exportar las rutas
module.exports = router;