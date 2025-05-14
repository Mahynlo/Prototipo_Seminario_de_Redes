// server/Serial.js
const { SerialPort } = require('serialport');
// db/sensorData.js
const db = require('../db/database');

const SERIAL_PATH = 'COM5'; // ⚠️ Asegúrate de que este sea tu puerto
//const SERIAL_PATH = '/dev/ttyUSB0'; //⚠️ puerto en linux
const BAUD_RATE = 9600;

let mySerialPort;
let bufferAcumulado = Buffer.alloc(0);
let reconectando = false;

function conectarPuerto(io) {
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
                const humedad = paquete.readFloatLE(0);
                const temperatura = paquete.readFloatLE(4);
                const indiceCalor = paquete.readFloatLE(8);
                const valorLuz = paquete.readInt16LE(12);
                const humedadSuelo = paquete.readInt16LE(14);
                const errorCode = paquete.readInt16LE(16);
                

                console.log(`🌡️ Temp: ${temperatura.toFixed(2)}°C | 💧 Hum: ${humedad.toFixed(2)}% | 🥵 Índice: ${indiceCalor.toFixed(2)}°C | 💡 Luz: ${valorLuz} | 🪴 Humedad suelo: ${humedadSuelo} | ❗Error: ${errorCode}`);

                io.emit('datosSensor', {
                    humedad: humedad.toFixed(2),
                    temperatura: temperatura.toFixed(2),
                    indiceCalor: indiceCalor.toFixed(2),
                    valorLuz: valorLuz,
                    humedadSuelo: humedadSuelo,
                    errorCode: errorCode
                });

                // Guardar datos normales
                db.run(`
      INSERT INTO datos_sensores (humedad, temperatura, indice_calor, valor_luz, humedad_suelo)
      VALUES (?, ?, ?, ?, ?)
    `, [humedad, temperatura, indiceCalor, valorLuz, humedadSuelo]);

                // 👉 Guardar alerta si hay error
                if (errorCode !== 0) {
                    //si es 1 es el sensor de humedad y temperatura
                    //si es 2 es el sensor de humedad del luz
                    //si es 3 es el sensor de humedad del suelo

                    if (errorCode === 1) {
                        errorcodeInterpretado = 'Error en el sensor de humedad y temperatura';
                    }
                    if (errorCode === 2) {
                        errorcodeInterpretado = 'Error en el sensor de humedad del luz';
                    }
                    if (errorCode === 3) {
                        errorcodeInterpretado = 'Error en el sensor de humedad del suelo';
                    }
                    const sensor = errorCode === 1 ? 'Sensor de humedad y temperatura' :
                        errorCode === 2 ? 'Sensor de humedad del luz' :
                            errorCode === 3 ? 'Sensor de humedad del suelo' : 'Desconocido';
                    const mensaje = `${errorcodeInterpretado} - Código de error: ${errorCode}`;

                    db.run(`
          INSERT INTO alertas (sensor, mensaje)
          VALUES (?, ?)
        `, [sensor, mensaje], (err) => {
                        if (err) {
                            console.error('❌ Error al guardar la alerta:', err.message);
                        } else {
                            console.log('⚠️ Alerta guardada en la base de datos');
                        }
                    });
                }

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


module.exports = {
    conectarPuerto,
};