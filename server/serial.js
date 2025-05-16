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
            return reintentarConexion(io);

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

                //convertir humedad del suelo a porcentaje donde 0 es el valor maximo y 1023 el minimo
                //convertir la luz a porcentaje donde 0 es el valor maximo y 1023 el minimo
                const valorLuzPorcentaje = (valorLuz / 1023) * 100;
                const humedadSueloPorcentaje = ((1023 - humedadSuelo) / 1023) * 100;



                console.log(`🌡️ Temp: ${temperatura.toFixed(2)}°C | 💧 Hum: ${humedad.toFixed(2)}% | 🥵 Índice: ${indiceCalor.toFixed(2)}°C | 💡 Luz: ${valorLuzPorcentaje} | 🪴 Humedad suelo: ${humedadSueloPorcentaje} | ❗Error: ${errorCode}`);


                // Guardar datos normales
                db.run(`
                        INSERT INTO datos_sensores (humedad, temperatura, indice_calor, valor_luz, humedad_suelo)
                        VALUES (?, ?, ?, ?, ?)
                        `, [humedad, temperatura, indiceCalor, valorLuzPorcentaje, humedadSueloPorcentaje]
                );

                // 👉 Guardar alerta si hay error
                if (errorCode !== 0) {
                    //si es 1 es el sensor de humedad y temperatura
                    //si es 2 es el sensor de humedad del luz
                    //si es 3 es el sensor de humedad del suelo

                    let errorcodeInterpretado = 'Error desconocido';

                    if (errorCode === 1) {
                        errorcodeInterpretado = 'Error en el sensor de humedad y temperatura';
                    } else if (errorCode === 2) {
                        errorcodeInterpretado = 'Error en el sensor de humedad de luz';
                    } else if (errorCode === 3) {
                        errorcodeInterpretado = 'Error en el sensor de humedad del suelo';
                    }

                    const sensor = errorCode === 1 ? 'Sensor de humedad y temperatura' :
                        errorCode === 2 ? 'Sensor de humedad del luz' :
                            errorCode === 3 ? 'Sensor de humedad del suelo' : 'Desconocido';
                    const mensaje = `${errorcodeInterpretado} - Código de error: ${errorCode}`;

                    db.run(`
                        INSERT INTO alertasArduino (sensor, mensaje)
                        VALUES (?, ?)
                    `, [sensor, mensaje], (err) => {
                        if (err) {
                            console.error('❌ Error al guardar la alerta:', err.message);
                        } else {
                            console.log('⚠️ Alerta guardada en la base de datos');
                        }
                    });
                }

                // Obtener planta activa (por ahora simplemente la última insertada)
                db.get(`SELECT * FROM plantas ORDER BY id DESC LIMIT 1`, (err, planta) => {
                    if (err) {
                        console.error('❌ Error al obtener planta:', err.message);
                        return;
                    }
                    if (!planta) {
                        console.warn('⚠️ No hay plantas registradas.');
                        return;
                    }

                    const lectura = {
                        humedad: humedad,
                        temperatura: temperatura,
                        humedad_suelo:humedadSueloPorcentaje ,
                        luz: valorLuzPorcentaje
                    };

                    const alertasGeneradas = generarAlertas(lectura, planta);


                    if (alertasGeneradas.length > 0) {
                        const mensajes = alertasGeneradas.join(' | ');
                        db.run(`
                            INSERT INTO alertasPlanta (planta, fecha, mensajes)
                            VALUES (?, datetime('now'), ?)
                            `, [planta.nombre, mensajes], (err) => {
                            if (err) {
                                console.error('❌ Error al guardar alertas de planta:', err.message);
                            } else {
                                console.log('⚠️ Alerta de planta registrada:', mensajes);
                            }
                        });

                        // enviar datos al cliente

                        io.emit('datosSensor', {
                            humedad: humedad.toFixed(2),
                            temperatura: temperatura.toFixed(2),
                            indiceCalor: indiceCalor.toFixed(2),
                            valorLuz: valorLuzPorcentaje.toFixed(2),
                            humedadSuelo: humedadSueloPorcentaje.toFixed(2),
                            errorCode: errorCode,
                            planta: planta.nombre,
                            mensajes: alertasGeneradas
                        });
                    }
                });


            } catch (error) {
                console.error('❌ Error procesando paquete:', error.message);
            }


        }

    });



    mySerialPort.on('close', () => { // Evento de cierre del puerto serie
        console.warn('⚠️ Puerto serie cerrado. Intentando reconectar...');
        reintentarConexion(io);

    });

    mySerialPort.on('error', (err) => { // Evento de error del puerto serie 
        console.error('❌ Error en el puerto serie:', err.message);
        reintentarConexion(io);

    });
}

function reintentarConexion(io) { // Función para reintentar la conexión al puerto serie
    if (reconectando) return;
    reconectando = true;

    setTimeout(() => {
        console.log('🔁 Intentando reconectar al puerto serial...');
        reconectando = false;
        conectarPuerto(io); // ✅ Pasa io de nuevo
    }, 3000);
}


function generarAlertas(lectura, planta) {
    const alertas = [];

    //console.log('📦 Paquete recibido:', lectura);
    //console.log('🌱 Planta:', planta);

    if (lectura.humedad < planta.humedad_min)
        alertas.push('⚠️ Humedad del aire demasiado baja.');
    else if (lectura.humedad > planta.humedad_max)
        alertas.push('⚠️ Humedad del aire demasiado alta.');

    if (lectura.temperatura < planta.temperatura_min)
        alertas.push('⚠️ Temperatura muy baja.');
    else if (lectura.temperatura > planta.temperatura_max)
        alertas.push('⚠️ Temperatura muy alta.');

    if (lectura.humedad_suelo < planta.humedad_suelo_min)
        alertas.push('💧 Humedad del suelo muy baja.');
    else if (lectura.humedad_suelo > planta.humedad_suelo_max)
        alertas.push('⚠️ Humedad del suelo muy alta.');

    if (planta.nivel_luz === 'sombra' && lectura.luz > (34/1023) * 100)
        alertas.push('🌞 Demasiada luz para una planta de sombra.');
    if (planta.nivel_luz === 'indirecta' && (lectura.luz < ((341/1023)*100) || lectura.luz > ((682/1023)*100) ))
        alertas.push('🌥️ Luz no adecuada para esta planta.');
    if (planta.nivel_luz === 'directa' && lectura.luz < ((683/1023)*100))
        alertas.push('☀️ Falta luz directa.');

    return alertas;
}




module.exports = {
    conectarPuerto,
};