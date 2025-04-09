let socket;
let humedad = "--";
let temperatura = "--";
let indiceCalor = "--";

let chart, humChart;
let labels = []; //ESTIQUETAS DE LA GRAFICA 
let tempData = []; // timpo en el eje X
let calorData = []; // <-- Array para almacenar los datos de temperatura
let humData = []; // <-- Array para almacenar los datos de humedad

function setup() {
  createCanvas(400, 300);
  textSize(20);
  textAlign(LEFT, TOP);

  // Conectar al socket
  socket = io();
  socket.on('datosSensor', (data) => {
    humedad = data.humedad;
    temperatura = data.temperatura;
    indiceCalor = data.indiceCalor;


    let tiempo = new Date().toLocaleTimeString();

    // Mostrar en HTML
    document.getElementById("temperatura").textContent = temperatura;
    document.getElementById("indiceCalor").textContent = indiceCalor;
    document.getElementById("humedad").textContent = humedad;

    document.getElementById("ultimaLectura").textContent = tiempo;


    // Actualizar datos para la gráfica
    labels.push(tiempo);
    tempData.push(parseFloat(temperatura));
    calorData.push(parseFloat(indiceCalor));
    humData.push(parseFloat(humedad)); // Agregar la humedad al array correspondiente

    // Limitar a los últimos 10 datos
    if (labels.length > 10) {
      labels.shift();
      tempData.shift();
      calorData.shift();
      humData.shift(); // Limitar también el array de humedad
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
    let minHum = Math.floor(Math.min(...humData) / 4) * 4;
    let maxHum = Math.ceil(Math.max(...humData) / 4) * 4;
    humChart.options.scales.y.min = minHum;
    humChart.options.scales.y.max = maxHum;

    // Actualizar ambas gráficas
    chart.update();
    humChart.update();
  });

  // Crear las gráficas
  crearGrafica();
  crearGraficaHumedad();
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




