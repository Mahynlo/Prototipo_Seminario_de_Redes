let socket;
let humedad = "--";
let temperatura = "--";
let indiceCalor = "--";
let valorLuz = "--";

let chart, humChart;
let labels = []; //ESTIQUETAS DE LA GRAFICA 
let tempData = []; // timpo en el eje X
let calorData = []; // <-- Array para almacenar los datos de temperatura
let humData = []; // <-- Array para almacenar los datos de humedad
let luzData = []; // <-- Array para almacenar los datos de luz


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

    // Depuración de datos
    console.log(data.humedad);
    console.log(data.temperatura);
    console.log(data.indiceCalor);
    console.log(data.valorLuz);

    let tiempo = new Date().toLocaleTimeString();// // Obtener la hora actual

    // Mostrar en HTML
    document.getElementById("temperatura").textContent = temperatura;
    document.getElementById("indiceCalor").textContent = indiceCalor;
    document.getElementById("humedad").textContent = humedad;
    document.getElementById("valorLuz").textContent = valorLuz;
    document.getElementById("ultimaLectura").textContent = tiempo;


    // Actualizar datos para la gráfica
    labels.push(tiempo);
    tempData.push(parseFloat(temperatura));
    calorData.push(parseFloat(indiceCalor));
    humData.push(parseFloat(humedad)); // Agregar la humedad al array correspondiente
    luzData.push(parseFloat(valorLuz));


    // Limitar a los últimos 10 datos
    if (labels.length > 10) {
      labels.shift();
      tempData.shift();
      calorData.shift();
      humData.shift(); // Limitar también el array de humedad
      luzData.shift(); // Limitar también el array de humedad
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
  });

  // Crear las gráficas
  crearGrafica();
  crearGraficaHumedad();
  crearGraficaLuz();

  //Depuración de errores de socket
  socket.on('connect_error', (err) => {
    console.error('❌ Error:', err.message);
  });
}

function draw() {
  //background(255); // Limpiar el fondo 
  //fill(0);
  //text("💧 Humedad: " + humedad + " %", 20, 80);
  //text("🌡️ Temperatura: " + temperatura + " °C", 20, 120);
  //text("🥵 Índice de Calor: " + indiceCalor + " °C", 20, 160);
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
      animation: false,
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
      animation: false,
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
      animation: false,
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





