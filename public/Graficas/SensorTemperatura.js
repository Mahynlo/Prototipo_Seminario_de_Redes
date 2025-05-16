export function crearGrafica(labels, tempData, calorData) {
  const ctx = document.getElementById('grafica').getContext('2d');
  const chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: '🌡️ Temperatura (°C)',
          data: tempData,
          borderColor: 'red',
          borderWidth: 2,
          pointRadius: 4,
          pointBackgroundColor: 'red',
          tension: 0.3,
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
          beginAtZero: false,
          ticks: { stepSize: 0.5 },
          title: {
            display: true,
            text: '°C',
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
        legend: { position: 'top' }
      }
    }
  });

  return chart;
}
