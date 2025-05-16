export function crearGraficaHumedad() {
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