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


server.listen(3000, () => { // Inicia el servidor en el puerto 3000
  console.log('🚀 Servidor escuchando en http://localhost:3000');
});
