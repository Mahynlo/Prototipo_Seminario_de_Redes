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

const path = require('path');
app.use(express.static(path.join(__dirname, '..')));


const mySerialPort = new SerialPort({
  path: 'COM4', // Cambia esto al puerto correcto en tu sistema operativo (Windows, Linux o Mac)
  baudRate: 9600, // Asegúrate de que la velocidad de baudios coincida con la configuración de tu dispositivo
});

const parser = mySerialPort.pipe(new ReadlineParser({ delimiter: '\n' })); // Cambia el delimitador si es necesario

mySerialPort.on('open', () => { // Abre el puerto serie
  console.log('✅ Puerto serie abierto en COM3');
});

parser.on('data', (data) => { // Escucha los datos del puerto serie
    console.log('📥 Datos recibidos:', data.trim());

    const partes = data.trim().split(',');
    if (partes.length === 3) {
      const humedad = partes[0];
      const temperatura = partes[1];
      const indiceCalor = partes[2];
      console.log(`🌡️ Temp: ${temperatura}°C | 💧 Hum: ${humedad}% | 🥵 Índice: ${indiceCalor}°C`);
      // 👉 Emitimos los datos al cliente p5.js
        io.emit('datosSensor', { humedad, temperatura, indiceCalor });
    }
});

//manejo de errores
mySerialPort.on('error', (err) => {
  console.error('❌ Error en el puerto serie:', err.message);
});



server.listen(3000, () => { // Inicia el servidor en el puerto 3000
  console.log('🚀 Servidor escuchando en http://localhost:3000');
}
);