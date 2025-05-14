let socket;
let humedad = "--";
let temperatura = "--";
let indiceCalor = "--";
let valorLuz = "--";
let humedadSuelo = "--";

let chart, humChart;
let labels = []; //ESTIQUETAS DE LA GRAFICA 
let tempData = []; // timpo en el eje X
let calorData = []; // <-- Array para almacenar los datos de temperatura
let humData = [];   // <-- Array para almacenar los datos de humedad
let luzData = [];   // <-- Array para almacenar los datos de luz
let soilData = [];  // <-- Array para almacenar los datos de humedad de suelo

function setup() {
  createCanvas(400, 300);
  textSize(20);
  textAlign(LEFT, TOP); // Alinear texto a la izquierda y arriba

  // Conectar al socket
  socket = io();

  socket.on('connect', () => { // Conexión exitosa
    console.log('🟢 Conectado al servidor Socket.IO con ID:', socket.id);
  });


  socket.on('datosSensor', (data) => { // Recibir datos del servidor

    //console.log('✅ Conectado al servidor Socket.IO');
    console.log("🔁 Datos recibidos del servidor:", data);

    // Actualizar variables globales de los sensores
    humedad = data.humedad;
    temperatura = data.temperatura;
    indiceCalor = data.indiceCalor;
    valorLuz = data.valorLuz;
    humedadSuelo = data.humedadSuelo;

    // Depuración de datos
    console.log(data.humedad);
    console.log(data.temperatura);
    console.log(data.indiceCalor);
    console.log(data.valorLuz);
    console.log(data.humedadSuelo);

    let tiempo = new Date().toLocaleTimeString();// // Obtener la hora actual

    // Mostrar en HTML
    document.getElementById("temperatura").textContent = temperatura;
    document.getElementById("indiceCalor").textContent = indiceCalor;
    document.getElementById("humedad").textContent = humedad;
    document.getElementById("valorLuz").textContent = valorLuz;
    document.getElementById("humedadSuelo").textContent = humedadSuelo;
    document.getElementById("ultimaLectura").textContent = tiempo;


    // Actualizar datos para la gráfica
    labels.push(tiempo);
    tempData.push(parseFloat(temperatura));
    calorData.push(parseFloat(indiceCalor));
    humData.push(parseFloat(humedad)); // Agregar la humedad al array correspondiente
    luzData.push(parseFloat(valorLuz));
    soilData.push(parseFloat(humedadSuelo));


    // Limitar a los últimos 10 datos
    if (labels.length > 10) {
      labels.shift();
      tempData.shift();
      calorData.shift();
      humData.shift(); // Limitar también el array de humedad
      luzData.shift(); // Limitar también el array de humedad
      soilData.shift();
    }

    // Calcular el mínimo y máximo de los datasets
    let todosLosValores = tempData.concat(calorData);
    let min = Math.min(...todosLosValores);
    let max = Math.max(...todosLosValores);

    // Ajustar a múltiplos de 3 hacia abajo y hacia arriba
    let nuevoMin = Math.floor(min / 3) * 3;
    let nuevoMax = Math.ceil(max / 3) * 3;

    // Actualizar el rango del eje Y de la gráfica de temperatura
    chart.options.scales.y.min = nuevoMin;
    chart.options.scales.y.max = nuevoMax;

    // Calcular el rango dinámico para la gráfica de humedad
    let minHum = Math.floor(Math.min(...humData) / 5) * 5;
    let maxHum = Math.ceil(Math.max(...humData) / 5) * 5;
    humChart.options.scales.y.min = minHum;
    humChart.options.scales.y.max = maxHum;

    // Calcular el rango dinámico para la gráfica de luz
    let minLuz = Math.floor(Math.min(...luzData) / 10) * 10;
    let maxLuz = Math.ceil(Math.max(...luzData) / 10) * 10;
    luzChart.options.scales.y.min = minLuz;
    luzChart.options.scales.y.max = maxLuz;

    luzChart.update();

    // Actualizar ambas gráficas
    chart.update();
    humChart.update();
    soilChart.update();
    luzChart.update();

    // Agregar fila a la tabla en tiempo real
    const fila = document.createElement('tr');
    fila.innerHTML = `
      <td>${new Date().toLocaleString()}</td>
      <td>${data.temperatura}</td>
      <td>${data.indiceCalor}</td>
      <td>${data.humedad}</td>
      <td>${data.valorLuz}</td>
      <td>${data.humedadSuelo}</td>
    `;
    const tabla = document.getElementById('tablaDatos');
    tabla.prepend(fila);

    // Limitar la tabla a 50 filas
    while (tabla.rows.length > 10) {
      tabla.deleteRow(tabla.rows.length - 1);
    }
  });

  socket.on('errorSensor', (data) => {
    alert(data.mensaje);
  });


  // Crear las gráficas
  crearGrafica();
  crearGraficaHumedad();
  crearGraficaLuz();
  crearGraficaSoil();

  // Carga los últimos datos guardados en la BD
  cargarDatosDesdeBD(); 

  //Depuración de errores de socket
  socket.on('connect_error', (err) => {
    console.error('❌ Error:', err.message);
  });
}

function cargarDatosDesdeBD() {
  fetch('/api/datos')
    .then(res => res.json())
    .then(datos => {
      const tabla = document.getElementById('tablaDatos');
      datos.forEach(data => {
        const fila = document.createElement('tr');
        fila.innerHTML = `
          <td>${new Date(data.timestamp).toLocaleString()}</td>
          <td>${data.temperatura}</td>
          <td>${data.indiceCalor}</td>
          <td>${data.humedad}</td>
          <td>${data.valorLuz}</td>
          <td>${data.humedadSuelo}</td>
        `;
        tabla.appendChild(fila);
      });

      datos.forEach(dato => {
        const hora = new Date(dato.timestamp).toLocaleTimeString();

        labels.push(hora);
        tempData.push(parseFloat(dato.temperatura));
        calorData.push(parseFloat(dato.indice_calor));
        humData.push(parseFloat(dato.humedad));
        luzData.push(parseFloat(dato.valor_luz));
        soilData.push(parseFloat(dato.humedad_suelo));
      });

      // Limitar a los últimos 10
      while (labels.length > 10) {
        labels.shift();
        tempData.shift();
        calorData.shift();
        humData.shift();
        luzData.shift();
        soilData.shift();
      }

      // Asignar explícitamente los datos a las gráficas
      chart.data.labels = labels;
      chart.data.datasets[0].data = tempData;
      chart.data.datasets[1].data = calorData;

      humChart.data.labels = labels;
      humChart.data.datasets[0].data = humData;

      luzChart.data.labels = labels;
      luzChart.data.datasets[0].data = luzData;

      soilChart.data.labels = labels;
      soilChart.data.datasets[0].data = soilData;

      // Ahora sí, actualizar
      chart.update();
      humChart.update();
      luzChart.update();
      soilChart.update();
    })
    .catch(err => console.error('❌ Error al cargar datos desde SQLite:', err));
}



function crearGrafica() {
  const ctx = document.getElementById('grafica').getContext('2d');
  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: '🌡️ Temperatura (°C)',
          data: tempData,
          borderColor: 'red',
          borderWidth: 2,
          pointRadius: 4,
          pointBackgroundColor: 'red',
          tension: 0.3, // hace la línea un poco curva
          fill: false
        },
        {
          label: '🥵 Índice de Calor (°C)',
          data: calorData,
          borderColor: 'orange',
          borderWidth: 2,
          pointRadius: 4,
          pointBackgroundColor: 'orange',
          tension: 0.3,
          fill: false,
          font: {
            size: 16
          }
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false, // permite que se adapte mejor si usas CSS
      animation: true,
      scales: {
        y: {
          beginAtZero: false,
          ticks: {
            stepSize: 0.5 // Para mostrar más detalle
          },
          title: {
            display: true,
            text: '°C',
            font: {
              size: 16
            }
          }
        },
        x: {
          title: {
            display: true,
            text: 'Hora',
            font: {
              size: 16
            }
          }
        }
      },
      plugins: {
        legend: {
          position: 'top'
        }
      }
    }
  });
}

function crearGraficaHumedad() {
  const ctx = document.getElementById('graficaHumedad').getContext('2d');
  humChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: '💧 Humedad (%)',
          data: humData,
          borderColor: 'blue',
          borderWidth: 2,
          pointRadius: 4,
          pointBackgroundColor: 'blue',
          tension: 0.3,
          fill: false,
          font: {
            size: 16
          }
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: true,
      scales: {
        y: {
          beginAtZero: false,
          ticks: {
            stepSize: 1
          },
          title: {
            display: true,
            text: '% Humedad',
            font: {
              size: 16
            }
          }
        },
        x: {
          title: {
            display: true,
            text: 'Hora',
            font: {
              size: 16
            }
          }
        }
      },
      plugins: {
        legend: {
          position: 'top'
        }
      }
    }
  });
}

function crearGraficaLuz() {
  const ctx = document.getElementById('graficaLuz').getContext('2d');
  luzChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: '💡 Intensidad de Luz',
          data: luzData,
          borderColor: 'gold',
          borderWidth: 2,
          pointRadius: 4,
          pointBackgroundColor: 'gold',
          tension: 0.3,
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: true,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Intensidad',
            font: { size: 16 }
          }
        },
        x: {
          title: {
            display: true,
            text: 'Hora',
            font: { size: 16 }
          }
        }
      },
      plugins: {
        legend: {
          position: 'top'
        }
      }
    }
  });
}

function crearGraficaSoil() {
  const ctx = document.getElementById('graficaSoil').getContext('2d');
  soilChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: '🪴 Nivel de humedad en el suelo',
          data: soilData,
          borderColor: 'brown',
          borderWidth: 2,
          pointRadius: 4,
          pointBackgroundColor: 'brown',
          tension: 0.3,
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: true,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Intensidad',
            font: { size: 16 }
          }
        },
        x: {
          title: {
            display: true,
            text: 'Hora',
            font: { size: 16 }
          }
        }
      },
      plugins: {
        legend: {
          position: 'top'
        }
      }
    }
  });
}