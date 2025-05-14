const { SerialPort } = require('serialport');
const express = require('express');
const socketIo = require('socket.io');
const http = require('http');
const path = require('path');

//Conexion con la base de datos
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./sensores.db', (err) => {
  if (err) {
    console.error('❌ Error al conectar con SQLite:', err.message);
  } else {
    console.log('✅ Conectado a la base de datos SQLite');
  }
});

//Crea o carga las bases de datos
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

db.run(`
  CREATE TABLE IF NOT EXISTS plantas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    humedad_min REAL,
    humedad_max REAL,
    temperatura_min REAL,
    temperatura_max REAL,
    nivel_luz TEXT,
    humedad_suelo_min REAL,
    humedad_suelo_max REAL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);


const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(path.join(__dirname, '..')));

//const SERIAL_PATH = 'COM6'; // ⚠️ Asegúrate de que este sea tu puerto
//const SERIAL_PATH = '/dev/ttyUSB0'; //⚠️ puerto en linux
const SERIAL_PATH = '/dev/ttyACM0';
const BAUD_RATE = 9600;

let mySerialPort;
let bufferAcumulado = Buffer.alloc(0);
let reconectando = false;

function conectarPuerto() {
  if (reconectando) return;

  mySerialPort = new SerialPort({
    path: SERIAL_PATH,
    baudRate: BAUD_RATE,
    autoOpen: false,
  });

  mySerialPort.open((err) => {
    if (err) {
      console.error('❌ No se pudo abrir el puerto:', err.message);
      return reintentarConexion();
    }
    console.log('✅ Puerto serie abierto en', SERIAL_PATH);
  });

  mySerialPort.on('data', (chunk) => {
  bufferAcumulado = Buffer.concat([bufferAcumulado, chunk]);

  while (bufferAcumulado.length >= 18) {
  const paquete = bufferAcumulado.slice(0, 18);
  console.log('📦 Paquete recibido:', paquete);
  bufferAcumulado = bufferAcumulado.slice(18);

  try {
    const humedad       = paquete.readFloatLE(0);
    const temperatura   = paquete.readFloatLE(4);
    const indiceCalor   = paquete.readFloatLE(8);
    const valorLuz      = paquete.readInt16LE(12);
    const humedadSuelo  = paquete.readInt16LE(14);
    const errorCode     = paquete.readInt16LE(16);

    console.log(`🌡️ Temp: ${temperatura.toFixed(2)}°C | 💧 Hum: ${humedad.toFixed(2)}% | 🥵 Índice: ${indiceCalor.toFixed(2)}°C | 💡 Luz: ${valorLuz} | 🪴 Humedad suelo: ${humedadSuelo} | ❗Error: ${errorCode}`);

    io.emit('datosSensor', {
      humedad: humedad.toFixed(2),
      temperatura: temperatura.toFixed(2),
      indiceCalor: indiceCalor.toFixed(2),
      valorLuz: valorLuz,
      humedadSuelo: humedadSuelo,
      errorCode: errorCode
    });

    db.run(`
      INSERT INTO datos_sensores (humedad, temperatura, indice_calor, valor_luz, humedad_suelo)
      VALUES (?, ?, ?, ?, ?)
    `, [humedad, temperatura, indiceCalor, valorLuz, humedadSuelo]);

  } catch (error) {
    console.error('❌ Error procesando paquete:', error.message);
  }
}

});



  mySerialPort.on('close', () => { // Evento de cierre del puerto serie
    console.warn('⚠️ Puerto serie cerrado. Intentando reconectar...');
    reintentarConexion();
  });

  mySerialPort.on('error', (err) => { // Evento de error del puerto serie 
    console.error('❌ Error en el puerto serie:', err.message);
    reintentarConexion();
  });
}

function reintentarConexion() { // Si hay un error o el puerto se cierra, intenta reconectar
  if (reconectando) return;
  reconectando = true;

  setTimeout(() => {
    console.log('🔁 Intentando reconectar al puerto serial...');
    reconectando = false;
    conectarPuerto();
  }, 3000); // Espera 3 segundos antes de reintentar
}

conectarPuerto();

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


//*************************************************************
// DATOS DE PLANTAS
app.use(express.json());

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
