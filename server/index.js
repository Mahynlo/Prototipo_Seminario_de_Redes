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

// 👉 Ruta para obtener historial de alertas
app.get('/api/alertas', (req, res) => {
  db.all('SELECT * FROM alertas ORDER BY id DESC', (err, rows) => {
    if (err) {
      console.error('❌ Error al consultar alertas:', err.message);
      return res.status(500).json({ error: 'Error al consultar alertas' });
    }
    res.json(rows);
  });
});

// 👉 Ruta para obtener historial de plantas
app.post('/plantas', (req, res) => {
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

  const query = `
    INSERT INTO plantas (
      nombre, humedad_min, humedad_max, temperatura_min, temperatura_max,
      nivel_luz, humedad_suelo_min, humedad_suelo_max
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(query, [
    nombre,
    humedad_min,
    humedad_max,
    temperatura_min,
    temperatura_max,
    nivel_luz,
    humedad_suelo_min,
    humedad_suelo_max
  ], function(err) {
    if (err) {
      console.error('❌ Error al insertar planta:', err.message);
      res.status(500).json({ error: 'Error al guardar la planta' });
    } else {
      console.log(`✅ Planta guardada con ID ${this.lastID}`);
      res.status(201).json({ message: 'Planta guardada correctamente', id: this.lastID });
    }
  });
});

//HACER FETCH A LA ULTIMA FILA
app.get('/plantas/ultima', (req, res) => {
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
