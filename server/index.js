// server/index.js
const express = require('express');
const socketIo = require('socket.io');
const http = require('http');
const path = require('path');

require('dotenv').config();

// db/sensorData.js
const db = require('../db/database');
// 👉 Importar conectarPuerto
const { conectarPuerto } = require('./serial'); // Ajusta la ruta si está en otro lado

const api = require('./api'); // Importar las rutas de la API

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Cors
const cors = require('cors');

const { iniciarNotificaciones } = require('./mail');
iniciarNotificaciones();


// configuración de middleware
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(express.json()); // Middleware para parsear JSON
app.use(express.urlencoded({ extended: true })); // Middleware para parsear URL-encoded
app.use(cors()); // Middleware para habilitar CORS para todas las rutas
// WebSocket
conectarPuerto(io); // Conectar al puerto serie

// se configura el socket.io
io.on('connection_error', (err) => { // Manejo de errores de conexión de Socket.IO
  console.log('Error de conexión Socket.IO:', err.message);
});




app.use('/api', api); // Usar las rutas de la API


//rutas de la app
app.get('/', (req, res) => { // Ruta principal
  res.sendFile(path.join(__dirname, '../public/views/index.html')); // Enviar el archivo HTML principal
});

//configuracion 
app.get('/configuracion', (req, res) => { // Ruta para la configuración
  res.sendFile(path.join(__dirname, '../public/views/configuracion.html')); // Enviar el archivo HTML de configuración
});


app.get('/historial-alertas', (req, res) => { // Ruta para el historial
  res.sendFile(path.join(__dirname, '../public/views/alertas.html')); // Enviar el archivo HTML del historial
});

//historial lecturas
app.get('/historial-lecturas', (req, res) => { // Ruta para el historial de lect
  res.sendFile(path.join(__dirname, '../public/views/lecturas.html')); // Enviar el archivo HTML del historial de lecturas
});




//******************************************************************************************************

server.listen(3000, () => { // Inicia el servidor en el puerto 3000
  console.log('🚀 Servidor escuchando en http://localhost:3000');
});
