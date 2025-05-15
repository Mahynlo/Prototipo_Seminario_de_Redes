// server/index.js
const express = require('express');
const socketIo = require('socket.io');
const http = require('http');
const path = require('path');

// db/sensorData.js
const db = require('../db/database');
// 👉 Importar conectarPuerto
const { conectarPuerto } = require('./serial'); // Ajusta la ruta si está en otro lado

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(path.join(__dirname, '..'))); // Servir archivos estáticos desde la raíz del proyecto
app.use(express.json()); // Middleware para parsear JSON
app.use(express.urlencoded({ extended: true })); // Middleware para parsear URL-encoded


conectarPuerto(io); // Conectar al puerto serie

io.on('connection_error', (err) => { // Manejo de errores de conexión de Socket.IO
  console.log('Error de conexión Socket.IO:', err.message);
});

// Agrega esto antes de server.listen(3000, ...)

// Ruta para obtener todos los datos históricos
app.get('/api/sensores', (req, res) => {
  db.all('SELECT * FROM datos_sensores ORDER BY timestamp DESC', (err, rows) => {
    if (err) {
      console.error('❌ Error al leer datos:', err.message);
      return res.status(500).json({ error: 'Error al leer datos' });
    }
    res.json(rows);
  });
});

//ruta para obtener el dato mas reciente
app.get('/api/sensores/ultimo', (req, res) => {
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
app.get('/api/alertasArduino', (req, res) => {
  db.all('SELECT * FROM alertasArduino ORDER BY id DESC', (err, rows) => {
    if (err) {
      console.error('❌ Error al consultar alertas:', err.message);
      return res.status(500).json({ error: 'Error al consultar alertas' });
    }
    res.json(rows);
  });
});

// alerta de planta
app.get('/api/alertasPlanta', (req, res) => {
  db.all('SELECT * FROM alertasPlanta', (err, rows) => {
    if (err) {
      console.error('❌ Error al consultar alertas:', err.message);
      return res.status(500).json({ error: 'Error al consultar alertas' });
    }
    res.json(rows);
  });
});


app.get('/api/alertasApp', (req, res) => {
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
app.post('/api/plantas', (req, res) => {
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
app.get('/api/plantas/ultima', (req, res) => {
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


//******************************************************************************************************

server.listen(3000, () => { // Inicia el servidor en el puerto 3000
  console.log('🚀 Servidor escuchando en http://localhost:3000');
});
