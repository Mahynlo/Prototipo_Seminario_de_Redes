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

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(path.join(__dirname, '..')));

//const SERIAL_PATH = 'COM7'; // ⚠️ Asegúrate de que este sea tu puerto
const SERIAL_PATH = '/dev/ttyUSB0'; //⚠️ puerto en linux
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

    while (bufferAcumulado.length >= 20) { // Asegúrate de que el buffer tenga al menos 16 bytes
      const paquete = bufferAcumulado.slice(0, 20); // Extrae los primeros 16 bytes
      bufferAcumulado = bufferAcumulado.slice(20); // Elimina los bytes procesados del buffer acumulado

      // Datos corespondientes a los 16 bytes de la trama de datos
      const humedad = paquete.readFloatLE(0); // Humedad en % (4 bytes)
      const temperatura = paquete.readFloatLE(4); // Temperatura en °C (4 bytes)
      const indiceCalor = paquete.readFloatLE(8); // Índice de calor en °C (4 bytes)
      const valorLuz = paquete.readFloatLE(12); // Valor de luz en lux (4 bytes)
      const humedadSuelo = paquete.readFloatLE(16); // Valor de luz en lux (4 bytes)

      console.log(`🌡️ Temp: ${temperatura.toFixed(2)}°C | 💧 Hum: ${humedad.toFixed(2)}% | 🥵 Índice: ${indiceCalor.toFixed(2)}°C | 💡 Luz: ${valorLuz.toFixed(2)} | 🪴 Humedad suelo : ${humedadSuelo.toFixed(2)}`);

      io.emit('datosSensor', {
        humedad: humedad.toFixed(2),
        temperatura: temperatura.toFixed(2),
        indiceCalor: indiceCalor.toFixed(2),
        valorLuz: valorLuz.toFixed(2),
        humedadSuelo: humedadSuelo.toFixed(2)
      });

      db.run(`
        INSERT INTO datos_sensores (humedad, temperatura, indice_calor, valor_luz, humedad_suelo)
        VALUES (?, ?, ?, ?, ?)
      `, [humedad, temperatura, indiceCalor, valorLuz, humedadSuelo], (err) => {
        if (err) {
          console.error('❌ Error al insertar en SQLite:', err.message);
        } else {
          console.log('💾 Datos guardados en SQLite');
        }
      });

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

server.listen(3000, () => { // Inicia el servidor en el puerto 3000
  console.log('🚀 Servidor escuchando en http://localhost:3000');
});
