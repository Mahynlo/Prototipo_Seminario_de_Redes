// Descripción: Este archivo se encarga de abrir el puerto serie y recibir datos del Arduino. Los datos se procesan y se muestran en la consola.

// Requiere Node.js y la librería 'serialport' para manejar la comunicación serie.
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

//Importamos express para crear un servidor web
const express = require('express');
const socketIo = require('socket.io'); // Importamos socket.io para la comunicación en tiempo real
const http = require('http'); // Importamos http para crear un servidor web

//conexión a los datos 
const app = express();
const server = http.createServer(app); // Creamos un servidor HTTP
const io = socketIo(server); // Creamos una instancia de socket.io

let buffer = {
  humedad: null,
  temperatura: null,
  indiceCalor: null,
  valorLuz: null
};

const path = require('path');
app.use(express.static(path.join(__dirname, '..')));


const mySerialPort = new SerialPort({
  path: '/dev/ttyUSB0', // Cambia esto al puerto correcto en tu sistema operativo (Windows, Linux o Mac)
  baudRate: 9600, // Asegúrate de que la velocidad de baudios coincida con la configuración de tu dispositivo
});

const parser = mySerialPort.pipe(new ReadlineParser({ delimiter: '\n' })); // Cambia el delimitador si es necesario

mySerialPort.on('open', () => { // Abre el puerto serie
  console.log('✅ Puerto serie abierto en', mySerialPort.path);
});

parser.on('data', (linea) => {
  const data = linea.trim();
  console.log('📥 Línea recibida:', data);

  if (data.includes('Humedad')) {
    buffer.humedad = data.split(':')[1].trim().replace(' %', '');
  } else if (data.includes('Temperatura')) {
    buffer.temperatura = data.split(':')[1].trim().replace(' °C', '');
  } else if (data.includes('Índice')) {
    buffer.indiceCalor = data.split(':')[1].trim().replace(' °C', '');
  } else if (data.includes('Valor de luz')) {
    buffer.valorLuz = data.split(':')[1].trim();
  }

  // Cuando tengamos los tres valores, enviamos
  if (buffer.humedad && buffer.temperatura && buffer.indiceCalor && buffer.valorLuz) {
    console.log(`🌡️ Temp: ${buffer.temperatura}°C | 💧 Hum: ${buffer.humedad}% | 🥵 Índice: ${buffer.indiceCalor}°C | 💡 Luz: ${buffer.valorLuz}`);
    io.emit('datosSensor', { ...buffer });
    console.log('🛰️ Datos enviados a clientes');

    // Reiniciar buffer
    buffer = { humedad: null, temperatura: null, indiceCalor: null, valorLuz: null};
  }
});


//manejo de errores
mySerialPort.on('error', (err) => {
  console.error('❌ Error en el puerto serie:', err.message);
});

//Depuraión
io.on('connection_error', (err) => {
  console.log('Error de conexión Socket.IO:', err.message);
});


server.listen(3000, () => { // Inicia el servidor en el puerto 3000
  console.log('🚀 Servidor escuchando en http://localhost:3000');
}
);