// jobs/mail.js
const db = require('../db/database');
const resend = require('./resend');

let ultimoEnvio = null;
let alertasActivas = new Set(); // Usamos un Set para evitar duplicados
let intervaloActual = 60 * 60 * 1000;

async function enviarCorreo(destinatario, asunto, contenido) {
  try {
    const data = await resend.emails.send({
      from: 'Plantas <noreply@resend.dev>',
      to: destinatario,
      subject: asunto,
      html: contenido,
    });
    console.log('✅ Correo enviado:', data);
    return true;
  } catch (error) {
    console.error('❌ Error al enviar correo:', error);
    return false;
  }
}

async function procesarAlertas() {
  const config = await new Promise((resolve) => {
    db.get('SELECT * FROM alertas_correo ORDER BY id DESC LIMIT 1', (err, row) => {
      if (err || !row) {
        console.error('❌ Error al leer configuración:', err?.message || 'No hay configuración');
        resolve(null);
      } else {
        resolve(row);
      }
    });
  });

  if (!config || !config.correo) return;

  intervaloActual = config.intervalo_horas * 60 * 60 * 1000;

  const ahora = Date.now();
  if (ultimoEnvio && (ahora - ultimoEnvio) < intervaloActual) {
    return;
  }

  if (alertasActivas.size > 0) {
    const contenido = `
      <h2>Notificación de alertas</h2>
      <p>Se han detectado las siguientes alertas:</p>
      <ul>
        ${Array.from(alertasActivas).map(alerta => `<li>${alerta}</li>`).join('')}
      </ul>
      <p>Próxima notificación en ${config.intervalo_horas} horas.</p>
    `;

    const enviado = await enviarCorreo(config.correo, 'Resumen de alertas de tus plantas', contenido);
    
    if (enviado) {
      ultimoEnvio = ahora;
      alertasActivas.clear(); // Limpiar alertas después de enviar
    }
  }
}

function agregarAlerta(mensaje) {
  // Solo agregar si no existe ya esta alerta exacta
  if (!alertasActivas.has(mensaje)) {
    alertasActivas.add(mensaje);
  }
}

function iniciarNotificaciones() {
  setInterval(procesarAlertas, 60 * 1000);
  
  db.get('SELECT * FROM alertas_correo ORDER BY id DESC LIMIT 1', (err, row) => {
    if (row && row.intervalo_horas) {
      intervaloActual = row.intervalo_horas * 60 * 60 * 1000;
    }
  });
}

module.exports = { 
  iniciarNotificaciones,
  agregarAlerta
};